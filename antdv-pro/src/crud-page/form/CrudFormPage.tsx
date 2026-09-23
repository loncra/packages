import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type Ref,
  type SlotsType,
  type VNodeChild,
} from 'vue'
import {
  App,
  Button,
  Col,
  Divider,
  Form,
  FormItem,
  type FormInstance,
  Row,
  Space,
  theme,
} from 'antdv-next'
import {HistoryOutlined, SaveOutlined, UndoOutlined} from '@antdv-next/icons'
import {isBusinessSuccess, type RestResult} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useAntdvConfig} from '../../config-provider/useAntdvConfig'
import {useCrudConfig} from '../../crud-config-provider'
import DataLoadingCardPlan from '../../data-loading-card-plan'
import {useStaleCheck} from '../../_util/crud/useStaleCheck'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {useLocale} from '../../_util/useLocale'
import {isOperationTraceVisible, OperationTraceTable} from '../operation-trace'
import {usePageRegistry} from '../registry'
import {buildFormFields} from './fields'

/**
 * 壳自己要用、但**不一定在表单字段里**的实体键（见 `fetchEntity` 里的说明）。
 * - `id`：编辑态判定（禁用规则 / 标题 / 陈旧检查都要它）
 * - `version`：乐观锁版本戳（保留本地修改时要把服务端版本回写，见 `useStaleCheck`）
 * - `creationTime`：操作记录块的渲染条件 + 审计查询的 `after`
 */
const SHELL_ENTITY_KEYS = ['id', 'version', 'creationTime'] as const
import type {
  CrudFormPageConstructor,
  CrudFormPageExpose,
  CrudFormPageProps,
  CrudFormPageSlots,
  CrudStaleInfo,
  FormService,
  PageDeclContext,
  PageFormContext,
} from '../types'

/**
 * 表单页（新增 / 编辑）：**渲染 + 数据壳**一体，与 `CrudHomePage` 同构。
 *
 * 布局走 **`DataLoadingCardPlan`**（卡片 + 卡片头 + body 的 `Spin`，见 `BasicCrudQuery` 的用法）：
 * 卡片头不给就用宿主拼好的 `CrudConfig.resolveDefaultTitle()`；`$attrs` 直通卡片（贴边写
 * `:classes="{body:'p-0!'}"`）。初始加载的 loading 由它编排，**提交**的 loading 复用同一个
 * `loading`（表单体转圈 + 保存按钮自身转圈）。
 *
 * **出什么**
 * - 渲染：`page.form.fields` → `a-row` + `a-col` + `a-form-item` + 组件（`render` 逃生）；
 * - 数据链：`onMounted → preMounted → get(id) → postGetEntity → postMounted`、
 *   `validate → preSubmit → save → postSubmit → success`；
 * - **陈旧检查**：切回页签（卡片壳的 `onActivated`）时重拉一遍，跟基线比 —— 见 `useStaleCheck`
 *   （默认 `'prompt'`：本地没动就静默覆盖、动过才问；`page.staleCheck` / `CrudConfig.staleCheck` 可调）；
 * - 操作记录：`page.operationDataTraceTarget` + 实体的 `id` / `creationTime` 齐了才渲染（见 `OperationTrace`）；
 * - 插槽：`default`（字段行之后）、`beforeButton` / `afterButton`；事件：`success` / `resetFields` / `stale`。
 *
 * **不出什么**（宿主的事，pro 零新增配置）
 * - 不认路由 / 不认 i18n / 不认宿主布局：`id` 由宿主页壳从路由取出来传进来，文案走 `page.i18nResolver`
 *   （缺省落 `CrudConfig.i18nResolver`）；**标题**是宿主的事（没有 `titleText`，卡片头的默认标题来自
 *   宿主注入的 `resolveDefaultTitle`）；
 * - **提交成功后什么都不做**：只 `emit('success')` —— "回列表 / 关 tab / 记住偏好"由宿主接；
 *   想让壳跳过自己的成功动作，就让 `postSubmit` 返回真值（与旧壳语义一致）；
 * - **"被删 / 冲突"之后的收尾**（关 tab、回列表）由宿主接 `@stale` 做；不接就只弹提示（不丢数据）。
 */
const CrudFormPage = defineComponent({
  name: 'LCrudFormPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudFormPageProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudFormPageProps['id']>, default: undefined},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
  },
  slots: Object as SlotsType<CrudFormPageSlots<DefaultCrudEntity>>,
  emits: {
    /** 保存成功（**宿主在这里决定后续**：回列表 / 关 tab / 记住偏好） */
    success: (_result: RestResult<unknown>) => true,
    /** 表单被重置（页面声明的 `onReset` 也会被调） */
    resetFields: () => true,
    /** 陈旧检查有结论：`'deleted'` 记录被删 / `'modified'` 被别处改过（含用户已选择的处理结果） */
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    type TBody = DefaultCrudEntity
    const config = useCrudConfig()
    const antdv = useAntdvConfig()
    const locale = useLocale('Crud')
    const {message} = App.useApp()
    const {token} = theme.useToken()
    /** 字段组件表 + 值格式表（内置 + 宿主 CrudConfig 覆盖） */
    const registry = usePageRegistry()
    /** 系统字典（枚举桶 + 数据字典）：由基类统一拉，这里只消费 */
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    const formRef = ref<FormInstance>()
    /** 初始加载 + 提交共用的加载态（卡片壳的 `Spin` 与保存按钮都读它） */
    const spinning = ref(false)
    /** 实体初值来自声明，随后与服务端数据合并 */
    const entity = ref(props.page.form.createEntity()) as Ref<TBody>
    /** 表单壳要 `save` ⇒ 按**事实**窄化（声明层只保证"读得到数据"，不污染 `CrudPageCore`） */
    const service = computed(() => props.page.service as unknown as FormService<TBody, TBody>)
    /** 陈旧检查：默认 `'prompt'`（页级 / `CrudConfig` 可调；`false` 连请求都不发） */
    const stale = useStaleCheck({
      pageMode: props.page.staleCheck,
      defaultMode: 'prompt',
      entity,
      isDirty: () => !!formRef.value?.isFieldsTouched?.(),
      fetchRemote,
    })

    const ctx = computed<PageDeclContext>(() => ({
      variant: props.variant,
      extra: props.contextExtra,
    }))

    /**
     * i18n key → 文案：页面声明的 `i18nResolver` > `CrudConfig.i18nResolver` > key 本身
     * （谁都没有才原样返回 key：可见、可调试，不静默变空）。
     */
    const t = (key: string, named?: Record<string, unknown>) =>
      props.page.i18nResolver?.(key, named) ?? config.value.i18nResolver?.(key, named) ?? key

    /** 页级钩子的上下文：与声明级只差 `entity` 是 **Ref**（钩子要写初值） */
    const formCtx = (): PageFormContext<TBody> => ({...ctx.value, entity, t})

    const fields = computed(() =>
      buildFormFields({
        declared: props.page.form.fields,
        fields: props.page.fields ?? {},
        entity: entity.value,
        ctx: ctx.value,
        t,
        i18nPrefix: props.page.i18nPrefix,
        registry: registry.value,
        buckets: buckets.value,
        dictionaries: dictionaries.value,
      }),
    )

    /** 服务端实体 → 与首屏同口径的实体（`createEntity` 的默认值打底 + `postGetEntity`） */
    async function mergeRemote(data?: TBody): Promise<TBody> {
      const value = {...entity.value, ...(data ?? {})} as TBody
      return ((await props.page.form.postGetEntity?.(value, formCtx())) ?? value) as TBody
    }

    /** 取数并写回表单（首屏）：只写回"初值里存在的键"（`createEntity` 定的就是表单键集） */
    async function fetchEntity(id: unknown): Promise<TBody | undefined> {
      const result = (await service.value.get(id as never)) as RestResult<TBody>
      if (!isBusinessSuccess(result)) {
        message.warning(result.message)
        return
      }
      const value = await mergeRemote(result.data)
      // 表单字段：只写回"初值（`createEntity`）里存在的键"，别把服务端的无关字段拉进来
      for (const key in entity.value) {
        const next = (value as Record<string, unknown>)[key]
        if (next !== undefined) {
          ;(entity.value as Record<string, unknown>)[key] = next
        }
      }
      // 壳自己要用的字段：**声明里漏写就复制不到**（上面那条规则按初值过滤），这里替声明兜住 ——
      // 缺 `creationTime` 会让操作记录块永远不渲染，缺 `id` 会让编辑态判定/陈旧检查全失效。
      for (const key of SHELL_ENTITY_KEYS) {
        const next = (value as Record<string, unknown>)[key]
        if (next !== undefined) {
          ;(entity.value as Record<string, unknown>)[key] = next
        }
      }
      return value
    }

    /**
     * 重新取数（陈旧检查用）：与首屏同口径，但**不写回表单**。
     * 取不到返回 `undefined`；业务失败 `throw`（宿主 http 层已经提示过，这里不再弹第二遍）。
     */
    async function fetchRemote(): Promise<TBody | undefined> {
      if (props.id == null) {
        return
      }
      const result = (await service.value.get(props.id as never)) as RestResult<TBody>
      if (!isBusinessSuccess(result)) {
        throw new Error(result.message)
      }
      return mergeRemote(result.data)
    }

    /** 初始加载：loading 交给 `DataLoadingCardPlan`（它 `try/finally` 包住，并做 in-flight 去重） */
    async function load(): Promise<void> {
      await props.page.form.preMounted?.(formCtx())
      if (props.id != null) {
        const value = await fetchEntity(props.id)
        if (value) {
          stale.markBaseline(value)
        }
      }
      await props.page.form.postMounted?.()
    }

    /** 切回来检查陈旧（卡片壳的 `onActivated`）：有结论就抛给宿主收尾 */
    async function checkStale(): Promise<void> {
      const info = await stale.check()
      if (info) {
        emit('stale', info)
      }
    }

    async function doSubmit(): Promise<void> {
      spinning.value = true
      try {
        await props.page.form.preSubmit?.(formCtx())
        const result = await service.value.save(entity.value)
        if (!isBusinessSuccess(result)) {
          // 业务失败（含后端乐观锁拒绝）都走这里；文案在 `result.message` 里（宿主 http 层也会提示）
          message.warning(result.message)
          return
        }
        // 返回真值 = 调用方接管：壳跳过自己的成功动作，只通知
        const takenOver = await props.page.form.postSubmit?.(result, formCtx())
        // 保存成功 ⇒ 基线跟着走，否则切回来会把自己这次保存当成"别人改了"
        stale.markBaseline(entity.value)
        if (takenOver) {
          emit('success', result)
          return
        }
        message.success(result.message)
        emit('success', result)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        spinning.value = false
      }
    }

    function doReset(): void {
      formRef.value?.resetFields?.()
      props.page.form.onReset?.(formCtx())
      emit('resetFields')
    }

    expose<CrudFormPageExpose<TBody>>({
      // 同 `CrudHomePage`：expose 出去的一律是"值"（Vue 会解包 ref），用 getter 读 ref 保响应式
      get entity() {
        return entity.value
      },
      // 重置走同一条路（antd resetFields + 声明的 onReset + emit）—— 注意它清不到 `id` 之类的非表单键
      resetFields: doReset,
    })

    return () => (
      <DataLoadingCardPlan
        {...(attrs as Record<string, unknown>)}
        // 表单体转圈要同时覆盖"初始加载"与"提交" ⇒ 自己持 `spinning`，提交时也点亮它
        loading={spinning.value}
        onUpdate:loading={(value: boolean) => (spinning.value = value)}
        onMounted={load}
        onActivated={checkStale}
      >
        <Form
          ref={formRef}
          layout={antdv.state.formLayout}
          model={entity.value}
          onFinish={() => doSubmit()}
        >
          <Row gutter={[token.value.sizeMD, token.value.sizeMD]}>
            {fields.value.map((field) => (
              <Col
                key={String(field.key)}
                xs={24}
                sm={24}
                md={field.span}
                lg={field.span}
                xl={field.span}
                xxl={field.span}
              >
                <FormItem name={field.key} label={field.label} rules={field.rules}>
                  {field.render
                    ? (field.render({
                        entity: entity.value,
                        t,
                        variant: props.variant,
                        extra: props.contextExtra,
                      }) as VNodeChild)
                    : h(field.component as never, {
                        value: entity.value[field.key],
                        'onUpdate:value': (value: unknown) => {
                          ;(entity.value as Record<string, unknown>)[field.key as string] = value
                        },
                        ...field.props,
                      })}
                </FormItem>
              </Col>
            ))}
          </Row>
          {/* 字段行之后：宿主内容（子表这类）；再下面是操作记录（pro 的能力，值不齐自动不渲染） */}
          {slots.default?.({entity: entity.value, extra: props.contextExtra})}
          {/*
            操作记录：**分割线由这里（页面壳）自己加**，表格组件只管表格（这样只想要表格的场景
            —— 如审计列表页 —— 引表格时不会被带上一块标题）。条件用同一个判定函数，
            值不齐时连分割线一起不出。
          */}
          {isOperationTraceVisible(props.page.operationDataTraceTarget, entity.value) && (
            <>
              <Divider titlePlacement="start" plain>
                <Space>
                  <HistoryOutlined />
                  <span>{locale.value.operationTrace.title}</span>
                </Space>
              </Divider>
              <OperationTraceTable
                target={props.page.operationDataTraceTarget}
                entity={entity.value}
              />
            </>
          )}
          <Space>
            {slots.beforeButton?.()}
            <Button type="primary" htmlType="submit" loading={spinning.value}>
              {{
                icon: () => h(SaveOutlined),
                default: () => locale.value.save,
              }}
            </Button>
            <Button htmlType="button" disabled={spinning.value} onClick={doReset}>
              {{
                icon: () => h(UndoOutlined),
                default: () => locale.value.reset,
              }}
            </Button>
            {slots.afterButton?.()}
          </Space>
        </Form>
      </DataLoadingCardPlan>
    )
  },
}) as unknown as CrudFormPageConstructor

export default CrudFormPage

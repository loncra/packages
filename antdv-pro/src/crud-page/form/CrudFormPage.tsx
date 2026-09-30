import {computed, defineComponent, h, type PropType, ref, type Ref, type SlotsType, type VNodeChild,} from 'vue'
import {App, Button, Col, Divider, Form, type FormInstance, FormItem, Row, Space, theme,} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {HistoryOutlined, SaveOutlined, UndoOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {isBusinessSuccess, type RestResult} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useAntdvConfig} from '../../config-provider/useAntdvConfig'
import {useCrudConfig} from '../../crud-config-provider'
import DataLoadingCardPlan from '../../data-loading-card-plan'
import {useStaleCheck} from '../../_util/crud/useStaleCheck'
import {readPath, writePath} from '../../_util/crud/readPath'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {useLocale} from '../../_util/useLocale'
import {isOperationTraceVisible, OperationTraceTable} from '../operation-trace'
import {usePageRegistry} from '../registry'
import {collectFormSources, mergeSources} from '../../_util/crud/sources.ts'
import {fetchDataDictionaries, fetchEnumBuckets} from '../../basic-crud-query'
import {buildFormFields} from './fields'
import useStyle from './style'
import type {
  CrudFormPageConstructor,
  CrudFormPageExpose,
  CrudFormPageProps,
  CrudFormPageSlots,
  CrudStaleInfo,
  FormService,
  PageDeclContext,
  PageFieldRenderContext,
  PageFormContext,
  PageFormFieldSlots,
} from '../types'

/**
 * 壳自己要用、但**不一定在表单字段里**的实体键（见 `fetchEntity` 里的说明）。
 * - `id`：编辑态判定（禁用规则 / 标题 / 陈旧检查都要它）
 * - `version`：乐观锁版本戳（保留本地修改时要把服务端版本回写，见 `useStaleCheck`）
 * - `creationTime`：操作记录块的渲染条件 + 审计查询的 `after`
 */
const SHELL_ENTITY_KEYS = ['id', 'version', 'creationTime'] as const

/**
 * 声明级**插槽**的上下文投递：宿主写的每个插槽函数，参数**末尾**会多收一个字段 ctx
 * （与 `render` 逃生那个 `PageFieldRenderContext` 是**同一份**：实体 / `buckets` / `dictionaries` /
 * `t` / `extra`）⇒ 插槽里要读实体（典型是封面卡显示表单里的标题 / 正文）不必再自己"用模块级 ref
 * 记住实体"那种补丁（2026-09-29 补）。
 *
 * 放**末尾**是为了不破坏控件自己的插槽参数（`{file}` / `{option}`…）：既有单参数写法一字不用改，
 * 宿主按需多标一个参数即可。`ctx as never` 那处是 `PageFormFieldSlots` 的类型技巧（它的参数故意
 * 写成 `never[]` 好让宿主自己标注真实形状）⇒ 壳这边只能按"任意参数"转发。
 */
function withFieldCtx(
  slots: PageFormFieldSlots | undefined,
  ctx: PageFieldRenderContext<DefaultCrudEntity>,
): PageFormFieldSlots | undefined {
  if (!slots) {
    return undefined
  }
  const wrapped: PageFormFieldSlots = {}
  for (const [name, fn] of Object.entries(slots)) {
    wrapped[name] = (...args: never[]) => fn(...args, ctx as never)
  }
  return wrapped
}

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
    /**
     * 样式：pro **不写内联 `style`**（规矩）+ 不带 Tailwind ⇒ 一律 CSS-in-JS。
     * ⚠️ `hashId` / `cssVarCls` 必须挂到元素上，否则规则生成了也不命中。
     */
    const antdConfig = useConfig()
    const prefixCls = computed(() =>
      antdConfig.value.getPrefixCls('crud-form-page', 'loncra-crud-form-page'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    /** 字段组件表 + 值格式表（内置 + 宿主 CrudConfig 覆盖） */
    const registry = usePageRegistry()
    /**
     * 系统字典（枚举桶 + 数据字典）：**form 不走 `BasicCrudQuery`（那是列表的基类）⇒ 由本壳自己拉**。
     * 加载清单从**字段字典 + 表单条目**推导（`collectFormSources`）—— 声明里写 `enumRef` / `dictId`
     * 就够，页面不必再抄一份 `enums` / `dictionaryCodes`。列表那半是自己的 `collectTableSources`
     * （只收"列上有搜索项"的），两边各算各的。
     */
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    const sources = computed(() =>
      // 显式声明的来源（`form.enums` / `form.dictionaryCodes`）与推导结果合并 —— 与列表同一口径
      mergeSources(collectFormSources(props.page.form.fields, props.page.fields ?? {}), {
        enums: props.page.form.enums,
        dictionaryCodes: props.page.form.dictionaryCodes,
      }),
    )

    /** 拉来源（与列表同一个口径）：结果喂给 `buildFormFields` 的 options */
    async function loadSources(): Promise<void> {
      const [nextBuckets, nextDictionaries] = await Promise.all([
        fetchEnumBuckets(sources.value.enums),
        fetchDataDictionaries(sources.value.dictionaryCodes),
      ])
      buckets.value = nextBuckets
      dictionaries.value = nextDictionaries
    }

    const formRef = ref<FormInstance>()
    /** 初始加载 + 提交共用的加载态（卡片壳的 `Spin` 与保存按钮都读它） */
    const spinning = ref(false)
    /** 实体初值来自声明，随后与服务端数据合并 */
    const entity = ref(props.page.form.createEntity()) as Ref<TBody>
    /**
     * 读侧服务：表单壳要 `get` / `save` ⇒ 按**事实**窄化（声明层只保证"读得到数据"，
     * 不污染 `CrudPageCore`）。
     *
     * ⚠️ `CrudFormCore.service` 是**可选**的（"发送"这类只提交、不取数不编辑的页面不给它）：
     * 那种情况这里其实是 `undefined` —— 只有**编辑态取数**会踩到它（而编辑页必然给了 `service`）；
     * 提交那条路走下面的 `submitEntity()`，那里有明确的守卫。
     */
    const service = computed(() => props.page.service as unknown as FormService<TBody, TBody>)

    /**
     * 提交：声明写了 `form.submit` 就用它（"发送"这类页面的提交自成一件事），否则走 `service.save`。
     * 两者都没有 ⇒ **当场抛**（别等用户点了按钮才知道没接线）。
     */
    async function submitEntity(): Promise<RestResult<unknown>> {
      const submit = props.page.form.submit
      if (submit) {
        return submit(entity.value, formCtx())
      }
      if (!props.page.service) {
        throw new Error('[crud-page] 表单声明既没给 form.submit、也没给 service：提交无处可去')
      }
      return service.value.save(entity.value)
    }
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
    const formCtx = (): PageFormContext<TBody> => ({
      ...ctx.value,
      entity,
      t,
      // 统一加载好的来源也递进 ctx（`load()` 里 `loadSources()` 在前）⇒ 页级钩子别再自己拉一遍
      buckets: buckets.value,
      dictionaries: dictionaries.value,
    })

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

    /**
     * 字段组件实例：按 key 收（`beforeSubmit` 要拿它调方法，如附件的 `upload()`）。
     *
     * 字段是 `v-for` 出来的 ⇒ 只能用函数 ref；**setter 缓存住**（同一 key 每轮渲染返回同一个函数，
     * 否则 Vue 在 ref 身份变化时会先清一次，白抖一下）。`visible: false` 的字段根本没渲染 ⇒
     * 表里没有它，`beforeSubmit` 收到 `undefined`，由 spec 实现自己容错。
     */
    const fieldInstances = new Map<string, unknown>()
    const fieldRefSetters = new Map<string, (instance: unknown) => void>()
    function fieldRef(key: string): (instance: unknown) => void {
      const cached = fieldRefSetters.get(key)
      if (cached) {
        return cached
      }
      const setter = (instance: unknown) => {
        if (instance == null) {
          fieldInstances.delete(key)
        } else {
          fieldInstances.set(key, instance)
        }
      }
      fieldRefSetters.set(key, setter)
      return setter
    }

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
      // 先拉来源（枚举桶 / 数据字典）：下拉的 options 由 `buildFormFields` 从它们算出来
      await loadSources()
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

    /**
     * 提交前的"组件准备"：**按声明顺序**把每个字段的 `beforeSubmit` 跑一遍
     * （附件先把本地文件上传成 `ObjectWriteResult`、键值表先把正在编辑的行确认进值）。
     *
     * 排在声明层的 `preSubmit` 之前：那个钩子是"提交前最后一件事"，看到的应该是准备完的最终值。
     */
    async function runFieldsBeforeSubmit(): Promise<void> {
      for (const field of fields.value) {
        await field.beforeSubmit?.(fieldInstances.get(String(field.key)))
      }
    }

    async function doSubmit(): Promise<void> {
      spinning.value = true
      try {
        await runFieldsBeforeSubmit()
        await props.page.form.preSubmit?.(formCtx())
        const result = await submitEntity()
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
      // 统一加载好的来源：壳的插槽逃生读它（声明已经拉了，别再发一次同样的请求）
      get buckets() {
        return buckets.value
      },
      get dictionaries() {
        return dictionaries.value
      },
    })

    /**
     * 按钮区：**给了 `#buttons` 就整排用宿主的**（不给就是壳自己的「保存 / 重置」）。
     *
     * 参数里带着壳这两颗按钮的 VNode + 当前 `loading`（照 `a-modal` 的 `footer: ({extra}) => …`
     * 那个路子）：想留哪颗就把哪颗放回去 —— 它的提交 / 重置 / loading 逻辑照旧，只是位置由宿主定。
     * 例：只要「重置」、把「保存」换成自己的「发送」：
     * `({resetButton, loading}) => [h(发送, {loading, htmlType: 'submit'}), resetButton]`
     */
    function renderButtons(): VNodeChild {
      const submitButton = () => (
        <Button type="primary" htmlType="submit" loading={spinning.value}>
          {{
            icon: () => h(SaveOutlined),
            default: () => locale.value.save,
          }}
        </Button>
      )
      const resetButton = () => (
        <Button htmlType="button" disabled={spinning.value} onClick={doReset}>
          {{
            icon: () => h(UndoOutlined),
            default: () => locale.value.reset,
          }}
        </Button>
      )
      if (!slots.buttons) {
        return [submitButton(), resetButton()]
      }
      return slots.buttons({
        entity: entity.value,
        extra: props.contextExtra,
        loading: spinning.value,
        submitButton,
        resetButton,
      }) as VNodeChild
    }

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
          <Row gutter={[token.value.sizeMD,0]}>
            {fields.value.map((field) => {
              /** 字段上下文：`render` 逃生与**声明级插槽**共用同一份（实体 / 统一加载的来源 / `t` / `extra`） */
              const fieldCtx: PageFieldRenderContext<DefaultCrudEntity> = {
                entity: entity.value,
                t,
                // 与 `buildFormFields` 的 `renderCtx` 同一份来源：逃生字段自己取桶喂控件，
                // 不必让宿主/壳再拉一次（同一份桶两处请求 = 不规范）
                buckets: buckets.value,
                dictionaries: dictionaries.value,
                variant: props.variant,
                extra: props.contextExtra,
              }
              // 控件本体：注册表实例化（props + 声明级插槽，插槽参数末尾带 `fieldCtx`），或 `render` 逃生整块自绘
              const control = field.render
                ? (field.render(fieldCtx) as VNodeChild)
                : h(
                    field.component as never,
                    {
                      ref: fieldRef(String(field.key)),
                      // 取值 / 写回走同一个路径口径（`field.name` 是拆好的段数组，只给 `a-form-item` 校验用）
                      value: readPath(entity.value, field.key),
                      'onUpdate:value': (value: unknown) =>
                        writePath(entity.value, field.key, value),
                      ...field.props,
                    },
                    withFieldCtx(field.slots, fieldCtx),
                  )
              return (
                // 栅格跨度**整包来自声明**（`field.col`；没写 `col` 时 `buildFormFields` 已补上
                // pro 默认断点）—— pro 不在这里加工任何断点，官方 `Col` 的语义原样生效
                <Col key={String(field.key)} {...field.col}>
                  {field.ownFormItem ? (
                    // 组件自己画标题栏、行内自带 `a-form-item`（如 keyValueTable）⇒ 外层不再包（包了双标题）
                    control
                  ) : (
                    <FormItem name={field.name} label={field.label} rules={field.rules}>
                      {control}
                    </FormItem>
                  )}
                </Col>
              )
            })}
          </Row>
          {/* 字段行之后：宿主内容（子表这类）；再下面是操作记录（pro 的能力，值不齐自动不渲染） */}
          {slots.default?.({
            entity: entity.value,
            extra: props.contextExtra,
            // 同一份 `loadSources` 结果交给宿主槽（喂下拉用）：壳里不必再发一次同样的请求
            buckets: buckets.value,
            dictionaries: dictionaries.value,
          })}
          {/*
            操作记录：**分割线由这里（页面壳）自己加**，表格组件只管表格（这样只想要表格的场景
            —— 如审计列表页 —— 引表格时不会被带上一块标题）。条件用同一个判定函数，
            值不齐时连分割线一起不出。
          */}
          {isOperationTraceVisible(props.page.operationDataTraceTarget, entity.value) && (
            <div
              class={classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-operation-trace`,
              )}
            >
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
            </div>
          )}
          <Space>{renderButtons()}</Space>
        </Form>
      </DataLoadingCardPlan>
    )
  },
}) as unknown as CrudFormPageConstructor

export default CrudFormPage

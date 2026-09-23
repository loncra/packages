import {computed, defineComponent, type PropType, ref, type Ref, type SlotsType} from 'vue'
import {App, Descriptions, Divider, Space} from 'antdv-next'
import {HistoryOutlined} from '@antdv-next/icons'
import {isBusinessSuccess, type RestResult} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useAntdvConfig} from '../../config-provider/useAntdvConfig'
import {useCrudConfig} from '../../crud-config-provider'
import DataLoadingCardPlan from '../../data-loading-card-plan'
import {isOperationTraceVisible, OperationTraceTable} from '../operation-trace'
import {useStaleCheck} from '../../_util/crud/useStaleCheck'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {useLocale} from '../../_util/useLocale'
import {usePageRegistry} from '../registry'
import {buildDetailItems} from './items'
import type {
  CrudDetailPageConstructor,
  CrudDetailPageExpose,
  CrudDetailPageProps,
  CrudDetailPageSlots,
  CrudStaleInfo,
  PageDeclContext,
} from '../types'

/** `a-descriptions` 的响应式列数（声明没给 `column` 就用它） */
const DEFAULT_COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 详情页：**渲染 + 数据壳**一体（与 `CrudHomePage` / `CrudFormPage` 同构）。
 *
 * 布局走 **`DataLoadingCardPlan`**（卡片 + 卡片头 + body 的 `Spin`）：卡片头不给就用宿主拼好的
 * `CrudConfig.resolveDefaultTitle()`；`$attrs` 直通卡片；loading 由它编排（取数在它的 `onMounted`）。
 *
 * **出什么**
 * - 渲染：`page.detail.fields` → `a-descriptions` 的 items（取值支持 `a.b` 路径、格式走注册表）；
 * - 数据链：`id` → `page.detail.getDetail(id, ctx)`（缺省 `service.get(id)`）→ `postGetEntity` → 实体；
 * - **陈旧检查**：切回页签时重拉一遍 —— 默认 `'overwrite'`（详情没有"本地编辑"可言，变了就**静静覆盖**，
 *   被删才提示）；`page.staleCheck` / `CrudConfig.staleCheck` 可调（含 `false` 关掉）；
 * - 插槽：`extra`（**卡片右上角**，与旧 `l-menu-title-card` 的 `#extra` 同位）、`afterDescriptions`、
 *   `afterOperationDataTrace`；事件：`stale`。
 *
 * **不出什么**（宿主的事）
 * - 不认路由：`id` 由宿主页壳从 `route.query` 取出来传进来；
 * - **标题**是宿主的事（没有 `titleText`；卡片头默认标题来自宿主注入的 `resolveDefaultTitle`）；
 * - `queryFields` 那种"参数缺失就跳 400、写 sessionStorage"是**宿主路由约定**，不进 pro；
 * - **"被删"之后的收尾**（关 tab / 回列表）由宿主接 `@stale` 做。
 */
const CrudDetailPage = defineComponent({
  name: 'LCrudDetailPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudDetailPageProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudDetailPageProps['id']>, default: undefined},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
  },
  slots: Object as SlotsType<CrudDetailPageSlots<DefaultCrudEntity>>,
  emits: {
    /** 陈旧检查有结论：`'deleted'` 记录被删 / `'modified'` 被别处改过（详情侧内容已按策略覆盖） */
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    const config = useCrudConfig()
    const antdv = useAntdvConfig()
    const locale = useLocale('Crud')
    const {message} = App.useApp()
    const registry = usePageRegistry()
    /** 系统字典：由基类统一拉，这里只消费（详情多数靠值自带的元数据，用不上桶） */
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    const entity = ref({} as TEntity) as Ref<TEntity>
    /** 陈旧检查：默认 `'overwrite'`（详情无本地编辑 ⇒ 变了直接覆盖；被删才提示） */
    const stale = useStaleCheck({
      pageMode: props.page.staleCheck,
      defaultMode: 'overwrite',
      entity,
      fetchRemote,
    })

    const ctx = computed<PageDeclContext>(() => ({
      variant: props.variant,
      extra: props.contextExtra,
    }))

    /** i18n key → 文案：页面声明 > CrudConfig > key 本身（同 `CrudFormPage`） */
    const t = (key: string, named?: Record<string, unknown>) =>
      props.page.i18nResolver?.(key, named) ?? config.value.i18nResolver?.(key, named) ?? key

    const items = computed(() =>
      buildDetailItems({
        declared: props.page.detail.fields,
        fields: props.page.fields ?? {},
        entity: entity.value,
        t,
        i18nPrefix: props.page.i18nPrefix,
        registry: registry.value,
        buckets: buckets.value,
        dictionaries: dictionaries.value,
      }),
    )

    /**
     * 取数：`page.detail.getDetail`（**收干净值** —— `RestResult` 的解包在宿主声明里做）
     * 或默认 `service.get(id)`（这里解包）；然后过一遍 `postGetEntity`。
     * **不写回表单/实体**，交给调用方（首屏直接赋值，陈旧检查只拿去比对）。
     */
    async function fetchRemote(): Promise<TEntity | undefined> {
      if (props.id == null) {
        return
      }
      let value: TEntity | undefined
      if (props.page.detail.getDetail) {
        value = await props.page.detail.getDetail(props.id, ctx.value)
      } else {
        const result = (await props.page.service.get(props.id as never)) as RestResult<TEntity>
        if (!isBusinessSuccess(result)) {
          throw new Error(result.message)
        }
        value = result.data as TEntity | undefined
      }
      if (value == null) {
        return
      }
      const merged = {...entity.value, ...value} as TEntity
      return ((await props.page.detail.postGetEntity?.(merged, ctx.value)) ?? merged) as TEntity
    }

    /** 首屏取数：loading 交给 `DataLoadingCardPlan`（它 `try/finally` 包住，并做 in-flight 去重） */
    async function load(): Promise<void> {
      try {
        const value = await fetchRemote()
        if (value == null) {
          // 首次就取不到（记录已被删 / id 不对）：给一句"已失效"，不留一个空页面
          if (props.id != null) {
            message.warning(locale.value.stale.deletedContent)
          }
          return
        }
        entity.value = value
        stale.markBaseline(value)
      } catch (error) {
        message.warning(error instanceof Error ? error.message : String(error))
      }
    }

    /** 切回来检查陈旧（卡片壳的 `onActivated`）：有结论就抛给宿主收尾 */
    async function checkStale(): Promise<void> {
      const info = await stale.check()
      if (info) {
        emit('stale', info)
      }
    }

    expose<CrudDetailPageExpose<TEntity>>({
      get entity() {
        return entity.value
      },
    })

    return () => (
      <DataLoadingCardPlan
        {...(attrs as Record<string, unknown>)}
        onMounted={load}
        onActivated={checkStale}
        v-slots={{
          // 卡片右上角：宿主的操作区（旧 `l-menu-title-card` 的 `#extra` 就是它）
          extra: slots.extra ? () => slots.extra?.() : undefined,
          default: () => (
            <>
              <Descriptions
                bordered
                title={locale.value.basicInformation}
                items={items.value}
                column={props.page.detail.column ?? DEFAULT_COLUMN}
                layout={antdv.state.detailLayout}
              />
              {/* 描述列表之后、操作记录之前：宿主放附表 / 资源树这类内容（作用域给实体与 extra） */}
              {slots.afterDescriptions?.({entity: entity.value, extra: props.contextExtra})}
              {/*
                操作记录（审计）：与表单壳同款 —— **分割线由页面壳自己加**（表格组件只管表格），
                条件用同一个判定函数（`target` + 实体 `id` / `creationTime` 三者齐），
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
              {/* 操作记录块之后的位置：宿主放"操作记录下面想要的东西" */}
              {slots.afterOperationDataTrace?.()}
            </>
          ),
        }}
      />
    )
  },
}) as unknown as CrudDetailPageConstructor

export default CrudDetailPage

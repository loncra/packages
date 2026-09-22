import {computed, defineComponent, type PropType, type Ref, ref, type SlotsType} from 'vue'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useCrudConfig} from '../../crud-config-provider'
import type {CrudNavigateKind} from '../../_util/crud/navigate'
import CrudTable from '../../crud-table/CrudTable'
import type {CollectionExpose} from '../../_util/crud/collectionExpose'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {SearchableColumnType} from '../../query-table/types'
import {usePageRegistry} from '../registry'
import {buildListColumns, renderCell, toCellVNode} from './columns'
import {collectListSources, mergeSources} from '../../_util/crud/sources.ts'
import type {PageDictionaries} from '../../basic-crud-query/types'
import type {
  CrudHomePageConstructor,
  CrudHomePageExpose,
  CrudHomePageProps,
  CrudHomePageSlots,
  PageDeclContext,
  PageListEntry,
} from '../types'

/**
 * 列表页渲染器：把 `page.list` 的声明翻成 `CrudTable` 的 props。
 *
 * 它只做"声明 → pro 既有 props"的映射：不认路由、不认 i18n、不认弹层。
 * 跳转交给 `page.onNavigate`（页面自己实现）或 `CrudConfig.onNavigate`（app 级兜底），
 * 文案交给 `page.i18nResolver`，枚举桶自己加载（client 直连）。
 *
 * 逃生：`$attrs` 直通 `CrudTable`（hide-title / record-actions / query / row-selection / scroll …）；
 * 页面插槽 `#title` / `#bodyCell` / `#expandedRowRender` 优先。
 */
const CrudHomePage = defineComponent({
  name: 'LCrudHomePage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudHomePageProps['page']>, required: true},
    variant: String,
    extra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
  },
  slots: Object as SlotsType<CrudHomePageSlots<DefaultCrudEntity>>,
  setup(props, {attrs, expose, slots}) {
    type TEntity = DefaultCrudEntity
    const config = useCrudConfig()
    const tableRef = ref<CollectionExpose<TEntity>>()
    /**
     * 宿主拿它按新的查询条件重刷（如 role 表单里的资源选择器跟着 sources 变）；
     * `clearDataSource` 用于"条件不成立时干脆不查、留空"。
     */
    const dataSource = ref([]) as Ref<TEntity[]>

    /**
     * 系统字典（枚举桶 + 数据字典）由 `CrudTable` → 基类在挂载时统一拉：
     * 这里只把声明里的 id/code 交下去，结果 `v-model` 回来喂给建列 / 单元格。
     */
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})
    /** 字段组件表 + 值格式表（内置 + 宿主 CrudConfig 覆盖） */
    const registry = usePageRegistry()

    const ctx = computed<PageDeclContext>(() => ({variant: props.variant, extra: props.extra}))

    /**
     * i18n key → 文案。三级兜底，谁都没有才原样返回 key（可见、可调试，不静默变空）：
     * 页面声明的 `i18nResolver` > `CrudConfig.i18nResolver`（app 级默认 i18n）> key 本身。
     * 列自己写了 `title` 的话，连这里都不走（见 `buildListColumns`）。
     */
    const t = (key: string) =>
      props.page.i18nResolver?.(key) ?? config.value.i18nResolver?.(key) ?? key

    const columnDefs = computed<PageListEntry<TEntity>[]>(() => props.page.list?.columns ?? [])

    /**
     * 要预载的来源（枚举桶 + 数据字典）：**从字段字典 + 列上的搜索项推导**
     * （来源在 `fields` 里写一处就够了）；页面显式写的 `list.enums` / `list.dictionaryCodes`
     * 只作逃生口合并进来（如 `enterprise-invitation` 的壳要从 `buckets` 取选项）。
     */
    const sources = computed(() =>
      mergeSources(collectListSources(columnDefs.value, props.page.fields ?? {}), props.page.list),
    )

    const columns = computed(() =>
      buildListColumns(
        columnDefs.value,
        props.page.fields ?? {},
        t,
        props.page.i18nPrefix,
        buckets.value,
        dictionaries.value,
        ctx.value,
        registry.value,
      ),
    )

    const recordActions = computed(() => {
      const declared = props.page.list?.recordActions
      return typeof declared === 'function' ? declared(ctx.value) : declared ?? []
    })

    /**
     * 跳转：页面声明给了 `onNavigate` 就用它（`record` 是精确实体），否则落到 app 级兜底；
     * 都没有就什么都不做 —— 内嵌列表（宿主给了形态名）安全。
     */
    function go(kind: CrudNavigateKind, record?: TEntity): void {
      const target = {kind, name: props.page.routes?.[kind], record, variant: props.variant}
      if (props.page.onNavigate) {
        props.page.onNavigate(target)
        return
      }
      config.value.onNavigate?.(target)
    }

    /**
     * 单元格内容，统一收敛成 VNode 交给表格：
     * 声明里认领的列（`render` / `format`）用 `renderCell` 的结果，不认领的用表格给的 `text`
     * （它可能是渲染好的 VNode，见 `toCellVNode` 的注释）。
     */
    function cellContent(slotProps: {
      column?: {key?: unknown}
      text: unknown
      record: TEntity
    }) {
      const declared = renderCell(
        columnDefs.value,
        props.page.fields ?? {},
        slotProps.column?.key,
        slotProps.record,
        buckets.value,
        dictionaries.value,
        registry.value,
      )
      return toCellVNode(declared === undefined ? slotProps.text : declared)
    }

    expose<CrudHomePageExpose<TEntity>>({
      fetchDataSource: () => tableRef.value?.fetchDataSource(),
      clearDataSource: () => {
        dataSource.value = []
      },
      // 同 `BasicCrudQuery`：expose 出去的一律是"值"（Vue 会解包 ref），用 getter 读 ref 保响应式
      get dataSource() {
        return dataSource.value
      },
      get buckets() {
        return buckets.value
      },
    })

    /**
     * 转给表格的透传属性：`scroll` **缺省 `{x: 'max-content'}`** —— 列表几乎都要横向铺开，
     * 没必要让每个页面壳（`*.home.page.ts` 的壳）都写一遍；宿主自己传了 `scroll` 就用宿主的
     * （`...attrs` 在后，天然覆盖默认）。有特殊需求（如再加 `y`）就自己传。
     */
    const tableAttrs = computed(() => ({scroll: {x: 'max-content'}, ...attrs}))

    return () => {
      return (
        <CrudTable
          ref={tableRef}
          service={props.page.service}
          columns={columns.value}
          drag={props.page.list?.drag}
          authority={props.page.list?.authority}
          toolbarActions={props.page.list?.toolbarActions}
          recordActions={recordActions.value}
          rowKey={props.page.rowKey}
          rowSelection={props.page.list?.rowSelection}
          enums={sources.value.enums}
          dictionaryCodes={sources.value.dictionaryCodes}
          dataSource={dataSource.value}
          buckets={buckets.value}
          dictionaries={dictionaries.value}
          onUpdate:dataSource={(value: TEntity[]) => {
            dataSource.value = value
          }}
          onUpdate:buckets={(value: EnumBucketsResponseBody) => {
            buckets.value = value
          }}
          onUpdate:dictionaries={(value: PageDictionaries) => {
            dictionaries.value = value
          }}
          onAdd={() => go('add')}
          onEdit={(record: TEntity) => go('edit', record)}
          onDetail={(record: TEntity) => go('detail', record)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            bodyCell: (slotProps: {
              text: unknown
              record: TEntity
              index: number
              column: SearchableColumnType<TEntity>
            }) => (slots.bodyCell ? slots.bodyCell(slotProps) : cellContent(slotProps)),
            expandedRowRender: slots.expandedRowRender
              ? (args: {record: TEntity; index: number; indent: number; expanded: boolean}) =>
                  slots.expandedRowRender?.(args)
              : undefined,
          }}
          // `$attrs` 直通（宿主的 `:record-actions` / `:drag` / `:query` … 从这里转给 CrudTable），
          // 其中 `scroll` 上面给了 `{x: 'max-content'}` 的默认值。
          // add / edit / detail 的默认语义是"跳转"（见上面的 `go()`）；宿主真在组件上绑同名事件，就是接管跳转。
          {...tableAttrs.value}
        />
      )
    }
  },
}) as unknown as CrudHomePageConstructor

export default CrudHomePage

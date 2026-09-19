import {computed, defineComponent, type PropType, type Ref, ref, type SlotsType} from 'vue'
import {useCrudConfig} from '../../crud-config-provider'
import type {CrudNavigateKind} from '../../crud-config-provider/types'
import CrudTable from '../../crud-table/CrudTable'
import type {CrudTableExpose} from '../../crud-table/types'
import type {DefaultCrudEntity, SearchableColumnType} from '../../query-table/types'
import {usePageRegistry} from '../registry'
import {usePageEnums} from '../usePageEnums'
import {buildListColumns, renderCell, toCellVNode} from './columns'
import type {
  CrudHomePageConstructor,
  CrudHomePageExpose,
  CrudHomePageProps,
  CrudHomePageSlots,
  ListPageContext,
  PageListEntry,
} from '../types'

type RuntimeProps = CrudHomePageProps<DefaultCrudEntity, DefaultCrudEntity>

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
    page: {type: Object as PropType<RuntimeProps['page']>, required: true},
    variant: String,
    extra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
  },
  slots: Object as SlotsType<CrudHomePageSlots<DefaultCrudEntity>>,
  setup(props, {attrs, expose, slots}) {
    type TEntity = DefaultCrudEntity
    const config = useCrudConfig()
    const tableRef = ref<CrudTableExpose<TEntity>>()
    /**
     * 宿主拿它按新的查询条件重刷（如 role 表单里的资源选择器跟着 sources 变）；
     * `clearDataSource` 用于"条件不成立时干脆不查、留空"。
     */
    const dataSource = ref([]) as Ref<TEntity[]>

    const {buckets, dicts} = usePageEnums(props.page.list?.enums, props.page.list?.dicts)
    /** 字段组件表 + 值格式表（内置 + 宿主 CrudConfig 覆盖） */
    const registry = usePageRegistry()

    const ctx = computed<ListPageContext>(() => ({variant: props.variant, extra: props.extra}))

    /**
     * i18n key → 文案。三级兜底，谁都没有才原样返回 key（可见、可调试，不静默变空）：
     * 页面声明的 `i18nResolver` > `CrudConfig.i18nResolver`（app 级默认 i18n）> key 本身。
     * 列自己写了 `title` 的话，连这里都不走（见 `buildListColumns`）。
     */
    const t = (key: string) =>
      props.page.i18nResolver?.(key) ?? config.value.i18nResolver?.(key) ?? key

    const columnDefs = computed<PageListEntry<TEntity>[]>(() => props.page.list?.columns ?? [])

    const columns = computed(() =>
      buildListColumns(
        columnDefs.value,
        props.page.fields ?? {},
        t,
        props.page.i18nPrefix,
        buckets.value,
        dicts.value,
        ctx.value,
        registry.value,
      ),
    )

    const rowActions = computed(() => {
      const declared = props.page.list?.rowActions
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
        dicts.value,
        registry.value,
      )
      return toCellVNode(declared === undefined ? slotProps.text : declared)
    }

    expose<CrudHomePageExpose<TEntity>>({
      fetchDataSource: () => tableRef.value?.fetchDataSource(),
      clearDataSource: () => {
        dataSource.value = []
      },
      dataSource,
    })

    return () => {
      // add / edit / detail 的语义是"跳转"，由本组件消费；不透传给 CrudTable，
      // 否则宿主的同名监听会和 onNavigate 一起触发，同一次点击两条路径。
      const rest = {...attrs}
      delete rest.onAdd
      delete rest.onEdit
      delete rest.onDetail

      return (
        <CrudTable
          ref={tableRef}
          service={props.page.service}
          columns={columns.value}
          drag={props.page.list?.drag}
          formatDragPreview={props.page.list?.formatDragPreview}
          authority={props.page.list?.authority}
          actions={props.page.list?.titleActions}
          rowActions={rowActions.value}
          rowKey={props.page.rowKey}
          rowSelection={props.page.list?.rowSelection}
          dataSource={dataSource.value}
          onUpdate:dataSource={(value: TEntity[]) => {
            dataSource.value = value
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
          {...rest}
        />
      )
    }
  },
}) as unknown as CrudHomePageConstructor

export default CrudHomePage

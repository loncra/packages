import {
  computed,
  defineComponent,
  type PropType,
  type Ref,
  ref,
  type SlotsType,
  useModel,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {type FilterRequest, type PageRequest} from '@loncra/client/commons'
import type {
  AuthorityProps,
  RecordActionDefinition,
  ToolbarActionDefinition,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
} from '../_util/crud/useCollectionData'
import QueryTable from '../query-table/QueryTable'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries, RefreshOnActivate} from '../basic-crud-query'
import type {QueryTableSlots, SearchableColumnType} from '../query-table/types'
import type {CrudTableConstructor, CrudTableProps} from './types'

const CRUD_TABLE_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedRows',
  'update:pagination',
  'update:buckets',
  'update:dictionaries',
  'action',
  'add',
  'edit',
  'detail',
  'deleted',
  'drop',
  'treeDrop',
] as const

/**
 * CRUD 表格门面：对外契约与以前完全一样，内部只做三处映射 ——
 * 旧标题三件套 → 基类 `title`（`hide-title` ⇔ `title={false}`）、
 * `actions` → `toolbarActions`、`recordActions`(boolean)+`rowActions` → 基类 `recordActions`。
 * 其余原样转发给 `QueryTable`（它再交给 `BasicCrudQuery` 基类）。
 */
const CrudTable = defineComponent({
  name: 'LCrudTable',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<CrudTableProps['service']>, required: true},
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    bordered: {type: Boolean, default: true},
    /**
     * 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"时 Vue 的布尔转换会把
     * 它变成 `false`（Vue 的既定行为，不是 bug）—— 那就等于"不要卡片头"：默认标题不出现，
     * 工具栏也会整排消失（见 `BasicCrudQuery` 的 `extra`）。
     */
    title: {type: [Object, Boolean] as PropType<CrudTableProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ToolbarActionDefinition<DefaultCrudEntity>[]>,
    rowActions: Array as PropType<RecordActionDefinition<DefaultCrudEntity>[]>,
    recordActions: {type: Boolean, default: true},
    /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dictionaries`）—— 原样交给基类 */
    enums: Array as PropType<CrudTableProps['enums']>,
    dictCodes: Array as PropType<CrudTableProps['dictCodes']>,
    /** 字典加载结果（基类 `v-model` 回来） */
    buckets: {type: Object as PropType<CrudTableProps['buckets']>, default: () => ({})},
    dictionaries: {type: Object as PropType<CrudTableProps['dictionaries']>, default: () => ({})},
    /** 拖拽开关 + 幽灵内容：`true` = 可拖（幽灵缺省主键）；`(record) => 内容` = 可拖且它就是幽灵 */
    drag: [Boolean, Function] as PropType<CrudTableProps['drag']>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowKey: [String, Function] as PropType<TableProps['rowKey']>,
    rowSelection: [Object, Boolean] as PropType<TableProps['rowSelection'] | false>,
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    prefixCls: String,
    rootClass: String,
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
  },
  emits: [...CRUD_TABLE_EMITS],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number
    const queryTable = ref<CollectionExpose<TEntity>>()

    // 双向绑定：透传给 QueryTable 时同时传值与 onUpdate，由最远端统一持有状态
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const selectedRows = useModel(props, 'selectedRows') as unknown as Ref<TEntity[]>
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
    const buckets = useModel(props, 'buckets') as unknown as Ref<EnumBucketsResponseBody>
    const dictionaries = useModel(props, 'dictionaries') as unknown as Ref<PageDictionaries>

    /** 行内动作：旧的"布尔开关 + 数组定义"合成基类的一个 `recordActions` */
    const recordActions = computed<RecordActionDefinition<TEntity>[] | false>(() =>
      props.recordActions === false ? false : (props.rowActions ?? []),
    )

    expose<CollectionExpose<TEntity>>({
      fetchDataSource: () => queryTable.value?.fetchDataSource() ?? Promise.resolve(),
      remove: (records) => queryTable.value?.remove(records),
    })

    return () => (
      <QueryTable
        ref={queryTable}
        {...attrs}
        service={props.service}
        columns={props.columns}
        immediate={props.immediate}
        refreshOnActivate={props.refreshOnActivate}
        title={props.title}
        hasPermission={props.hasPermission}
        authority={props.authority}
        toolbarActions={props.actions}
        recordActions={recordActions.value}
        enums={props.enums}
        dictCodes={props.dictCodes}
        bordered={props.bordered}
        drag={props.drag}
        onRow={props.onRow}
        rowKey={props.rowKey}
        rowSelection={props.rowSelection}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        dataSource={dataSource.value}
        loading={loading.value}
        query={query.value}
        selectedRows={selectedRows.value}
        pagination={pagination.value}
        buckets={buckets.value}
        dictionaries={dictionaries.value}
        onUpdate:dataSource={(value: TEntity[]) => (dataSource.value = value)}
        onUpdate:loading={(value: boolean) => (loading.value = value)}
        onUpdate:query={(value: FilterRequest | PageRequest) => (query.value = value)}
        onUpdate:selectedRows={(value: TEntity[]) => (selectedRows.value = value)}
        onUpdate:pagination={(value: unknown) => (pagination.value = value as TableProps['pagination'])}
        onUpdate:buckets={(value: EnumBucketsResponseBody) => (buckets.value = value)}
        onUpdate:dictionaries={(value: PageDictionaries) => (dictionaries.value = value)}
        onAction={(payload) => emit('action', payload)}
        onAdd={() => emit('add')}
        onEdit={(record: TEntity) => emit('edit', record)}
        onDetail={(record: TEntity) => emit('detail', record)}
        onDeleted={(records: TEntity[]) => emit('deleted', records)}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        onTreeDrop={(sorts, drag, target, payload) => emit('treeDrop', sorts, drag, target, payload)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          expandedRowRender: slots.expandedRowRender
            ? (args: {record: TEntity; index: number; indent: number; expanded: boolean}) =>
                slots.expandedRowRender?.(args)
            : undefined,
          bodyCell: slots.bodyCell
            ? ({
                text,
                record,
                index,
                column,
              }: {
                text: unknown
                record: TEntity
                index: number
                column: SearchableColumnType<TEntity>
              }) => slots.bodyCell?.({text, record, index, column})
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudTableConstructor

export default CrudTable
export type {CrudTableConstructor, CrudTableProps}

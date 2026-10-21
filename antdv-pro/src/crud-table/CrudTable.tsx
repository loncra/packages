import {defineComponent, type PropType, ref, type SlotsType} from 'vue'
import type {TableProps} from 'antdv-next'
import {type FilterRequest, type PageRequest} from '@loncra/client/commons'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {DEFAULT_COLLECTION_PAGINATION, type DefaultCrudEntity,} from '../_util/crud/useCollectionData'
import QueryTable from '../query-table/QueryTable'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDictionaries, RefreshOnActivate} from '../basic-crud-query'
import type {
  QueryTableBodyCellArgs,
  QueryTableExpandedRowArgs,
  QueryTableProps,
  QueryTableSlots,
  SearchableColumnType,
} from '../query-table/types'
import type {CrudTableConstructor} from './types'

const CrudTable = defineComponent({
  name: 'LCrudTable',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryTableProps['service']>, required: true},
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    bordered: {type: Boolean, default: true},
    plain: {type: Boolean, default: false},
    fetch: {type: Function as PropType<QueryTableProps['fetch']>, default: undefined},
    title: {type: [Object, Boolean] as PropType<QueryTableProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    toolbarActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['toolbarActions']>,
      default: undefined,
    },
    recordActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['recordActions']>,
      default: undefined,
    },
    enums: Array as PropType<QueryTableProps['enums']>,
    dictionaryCodes: Array as PropType<QueryTableProps['dictionaryCodes']>,
    buckets: {type: Object as PropType<QueryTableProps['buckets']>, default: () => ({})},
    dictionaries: {type: Object as PropType<QueryTableProps['dictionaries']>, default: () => ({})},
    drag: [Boolean, Function] as PropType<QueryTableProps['drag']>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowKey: [String, Function] as PropType<TableProps['rowKey']>,
    rowSelection: [Object, Boolean] as PropType<TableProps['rowSelection'] | false>,
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<QueryTableProps['classes']>,
    styles: Object as PropType<QueryTableProps['styles']>,
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
  },
  emits: [
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
  ],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    const queryTable = ref<CollectionExpose<DefaultCrudEntity>>()

    expose<CollectionExpose<DefaultCrudEntity>>({
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
        toolbarActions={props.toolbarActions}
        recordActions={props.recordActions}
        enums={props.enums}
        dictionaryCodes={props.dictionaryCodes}
        bordered={props.bordered}
        plain={props.plain}
        fetch={props.fetch}
        drag={props.drag}
        onRow={props.onRow}
        rowKey={props.rowKey}
        rowSelection={props.rowSelection}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        classes={props.classes}
        styles={props.styles}
        dataSource={props.dataSource}
        loading={props.loading}
        query={props.query}
        selectedRows={props.selectedRows}
        pagination={props.pagination}
        buckets={props.buckets}
        dictionaries={props.dictionaries}
        onUpdate:dataSource={(value: DefaultCrudEntity[]) => emit('update:dataSource', value)}
        onUpdate:loading={(value: boolean) => emit('update:loading', value)}
        onUpdate:query={(value: FilterRequest | PageRequest) => emit('update:query', value)}
        onUpdate:selectedRows={(value: DefaultCrudEntity[]) => emit('update:selectedRows', value)}
        onUpdate:pagination={(value: TableProps['pagination']) => emit('update:pagination', value)}
        onUpdate:buckets={(value: EnumBucketsResponseBody) => emit('update:buckets', value)}
        onUpdate:dictionaries={(value: PageDictionaries) => emit('update:dictionaries', value)}
        onAction={(payload) => emit('action', payload)}
        onAdd={() => emit('add')}
        onEdit={(record: DefaultCrudEntity) => emit('edit', record)}
        onDetail={(record: DefaultCrudEntity) => emit('detail', record)}
        onDeleted={(records: DefaultCrudEntity[]) => emit('deleted', records)}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        onTreeDrop={(sorts, drag, target, payload) => emit('treeDrop', sorts, drag, target, payload)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          extra: slots.extra ? () => slots.extra?.() : undefined,
          expandedRowRender: slots.expandedRowRender
            ? (args: QueryTableExpandedRowArgs) => slots.expandedRowRender?.(args)
            : undefined,
          bodyCell: slots.bodyCell
            ? (args: QueryTableBodyCellArgs) => slots.bodyCell?.(args)
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudTableConstructor

export default CrudTable
export type {CrudTableConstructor}

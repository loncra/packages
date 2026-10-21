import {defineComponent, type PropType, ref, type SlotsType} from 'vue'
import type {TableProps} from 'antdv-next'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import QueryCardGrid from '../query-card-grid/QueryCardGrid'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {DEFAULT_COLLECTION_PAGINATION, type DefaultCrudEntity,} from '../_util/crud/useCollectionData'
import type {RefreshOnActivate} from '../basic-crud-query/types'
import type {
    QueryCardGridItemActionsSlot,
    QueryCardGridItemSlot,
    QueryCardGridProps,
    QueryCardGridSlots,
} from '../query-card-grid/types'
import type {CrudCardGridConstructor} from './types'

const CrudCardGrid = defineComponent({
  name: 'LCrudCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryCardGridProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    title: {type: [Object, Boolean] as PropType<QueryCardGridProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    toolbarActions: {
      type: [Array, Boolean] as PropType<QueryCardGridProps['toolbarActions']>,
      default: undefined,
    },
    recordActions: {
      type: [Array, Boolean] as PropType<QueryCardGridProps['recordActions']>,
      default: undefined,
    },
    plain: {type: Boolean, default: false},
    fetch: {type: Function as PropType<QueryCardGridProps['fetch']>, default: undefined},
    drag: [Boolean, Function, Object] as PropType<QueryCardGridProps['drag']>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    rowKey: [String, Function] as PropType<QueryCardGridProps['rowKey']>,
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<QueryCardGridProps['classes']>,
    styles: Object as PropType<QueryCardGridProps['styles']>,
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedItems: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
  },
  emits: [
    'update:dataSource',
    'update:loading',
    'update:query',
    'update:selectedItems',
    'update:pagination',
    'action',
    'add',
    'edit',
    'detail',
    'deleted',
    'drop',
  ],
  slots: Object as SlotsType<QueryCardGridSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    const grid = ref<CollectionExpose<DefaultCrudEntity>>()

    expose<CollectionExpose<DefaultCrudEntity>>({
      fetchDataSource: () => grid.value?.fetchDataSource() ?? Promise.resolve(),
      remove: (records) => grid.value?.remove(records),
    })

    return () => (
      <QueryCardGrid
        ref={grid}
        {...attrs}
        service={props.service}
        immediate={props.immediate}
        refreshOnActivate={props.refreshOnActivate}
        title={props.title}
        hasPermission={props.hasPermission}
        authority={props.authority}
        toolbarActions={props.toolbarActions}
        recordActions={props.recordActions}
        plain={props.plain}
        fetch={props.fetch}
        drag={props.drag}
        gridColumns={props.gridColumns}
        selectable={props.selectable}
        rowKey={props.rowKey}
        pagination={props.pagination}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        classes={props.classes}
        styles={props.styles}
        dataSource={props.dataSource}
        loading={props.loading}
        query={props.query}
        selectedItems={props.selectedItems}
        onUpdate:dataSource={(value: DefaultCrudEntity[]) => emit('update:dataSource', value)}
        onUpdate:loading={(value: boolean) => emit('update:loading', value)}
        onUpdate:query={(value: FilterRequest | PageRequest) => emit('update:query', value)}
        onUpdate:selectedItems={(value: DefaultCrudEntity[]) => emit('update:selectedItems', value)}
        onUpdate:pagination={(value: TableProps['pagination']) => emit('update:pagination', value)}
        onAdd={() => emit('add')}
        onEdit={(record: DefaultCrudEntity) => emit('edit', record)}
        onDetail={(record: DefaultCrudEntity) => emit('detail', record)}
        onDeleted={(records: DefaultCrudEntity[]) => emit('deleted', records)}
        onAction={(payload) => emit('action', payload)}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          extra: slots.extra ? () => slots.extra?.() : undefined,
          empty: slots.empty ? () => slots.empty?.() : undefined,
          item: slots.item
            ? (slot: QueryCardGridItemSlot<DefaultCrudEntity>) => slots.item?.(slot)
            : undefined,
          itemActions: slots.itemActions
            ? (slot: QueryCardGridItemActionsSlot<DefaultCrudEntity>) => slots.itemActions?.(slot)
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudCardGridConstructor

export default CrudCardGrid
export type {CrudCardGridConstructor}

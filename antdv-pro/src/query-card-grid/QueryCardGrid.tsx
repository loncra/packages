import {defineComponent, type PropType, type SlotsType} from 'vue'
import type {TableProps} from 'antdv-next'
import {CardGrid, Empty} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {type FilterRequest, type PageRequest} from '@loncra/client/commons'
import BasicCrudQuery from '../basic-crud-query'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {DEFAULT_COLLECTION_PAGINATION, type DefaultCrudEntity,} from '../_util/crud/useCollectionData'
import type {RefreshOnActivate} from '../basic-crud-query/types'
import {resolveRowKey} from '../_util/crud/rowKey'
import {CARD_GRID_COLUMNS_VAR} from './constants'
import QueryCardGridDefaultItem from './item/QueryCardGridDefaultItem'
import {useQueryCardGrid} from './useQueryCardGrid'
import type {
  QueryCardGridConstructor,
  QueryCardGridEmits,
  QueryCardGridItemActionsSlot,
  QueryCardGridItemSlot,
  QueryCardGridProps,
  QueryCardGridSlots,
} from './types'

const QueryCardGrid = defineComponent({
  name: 'LQueryCardGrid',
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
    drag: [Boolean, Function, Object] as PropType<QueryCardGridProps['drag']>,
    plain: {type: Boolean, default: false},
    fetch: {type: Function as PropType<QueryCardGridProps['fetch']>, default: undefined},
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    rowKey: [String, Function] as PropType<TableProps['rowKey']>,
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
    const {
      prefixCls,
      hashId,
      cssVarCls,
      base,
      dataSource,
      loading,
      query,
      tablePagination,
      selectedItems,
      baseClasses,
      baseStyles,
      dragEnabled,
      buildDropZoneProps,
      dropTargetClass,
      isSelected,
      onSelect,
      itemActionsOf,
      onDragHandleStart,
      onDragHandleEnd,
    } = useQueryCardGrid(props, emit)

    expose<CollectionExpose<DefaultCrudEntity>>({
      fetchDataSource: async () => base.value?.fetchDataSource(),
      remove: (records) => base.value?.remove(records),
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...restAttrs} = attrs
      const gridClasses = props.classes?.cardGrid
      const gridStyles = props.styles?.cardGrid
      const shellAttrs = {size: 'small', ...restAttrs}
      const shellClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const shellStyle = [attrStyle, {[CARD_GRID_COLUMNS_VAR]: String(props.gridColumns)}]

      return (
        <BasicCrudQuery
          ref={base}
          {...shellAttrs}
          classes={baseClasses.value}
          styles={baseStyles.value}
          class={shellClass}
          style={shellStyle}
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
          selectedKey="selectedItems"
          dataSource={dataSource.value}
          loading={loading.value}
          query={query.value}
          selectedItems={selectedItems.value}
          pagination={tablePagination.value}
          onUpdate:dataSource={(value: DefaultCrudEntity[]) => (dataSource.value = value)}
          onUpdate:loading={(value: boolean) => (loading.value = value)}
          onUpdate:query={(value: FilterRequest | PageRequest) => (query.value = value)}
          onUpdate:selectedItems={(value: DefaultCrudEntity[]) => (selectedItems.value = value)}
          onUpdate:pagination={(value: TableProps['pagination']) => (tablePagination.value = value)}
          onAdd={() => emit('add')}
          onEdit={(record: DefaultCrudEntity) => emit('edit', record)}
          onDetail={(record: DefaultCrudEntity) => emit('detail', record)}
          onDeleted={(records: DefaultCrudEntity[]) => emit('deleted', records)}
          onAction={(payload) => emit('action', payload)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            default: () => (
              <div
                class={classNames(
                  prefixCls.value,
                  hashId.value,
                  cssVarCls.value,
                  `${prefixCls.value}-grid`,
                  (dataSource.value || []).length <= 0 && `${prefixCls.value}-grid-empty`,
                  gridClasses?.grid,
                )}
                style={gridStyles?.grid}
              >
                {(dataSource.value || []).length <= 0 ? (
                  slots.empty ? (
                    slots.empty()
                  ) : (
                    <Empty />
                  )
                ) : (
                  (dataSource.value || []).map((record, index) => {
                    const itemSlot: QueryCardGridItemSlot<DefaultCrudEntity> = {
                      record,
                      index,
                      selected: isSelected(record),
                      dragEnabled: dragEnabled.value,
                      onDragStart: (event: DragEvent) => onDragHandleStart(record, event),
                      onDragEnd: onDragHandleEnd,
                      itemActions: itemActionsOf(record),
                    }
                    const itemActionsSlot: QueryCardGridItemActionsSlot<DefaultCrudEntity> = {
                      record,
                      index,
                      dragEnabled: itemSlot.dragEnabled,
                      onDragStart: itemSlot.onDragStart,
                      onDragEnd: onDragHandleEnd,
                      itemActions: itemSlot.itemActions,
                    }
                    return (
                      <CardGrid
                        key={String(resolveRowKey(props.rowKey, record) ?? index)}
                        class={classNames(
                          prefixCls.value,
                          hashId.value,
                          cssVarCls.value,
                          `${prefixCls.value}-item`,
                          isSelected(record) && `${prefixCls.value}-item-selected`,
                          dropTargetClass(record),
                          gridClasses?.item,
                        )}
                        style={gridStyles?.item}
                      >
                        <div {...buildDropZoneProps(record)} onClick={() => onSelect(record)}>
                          {slots.item ? (
                            slots.item(itemSlot)
                          ) : (
                            <QueryCardGridDefaultItem
                              prefixCls={prefixCls.value}
                              hashId={hashId.value}
                              cssVarCls={cssVarCls.value}
                              title={String(resolveRowKey(props.rowKey, record) ?? '')}
                              itemActions={itemSlot.itemActions}
                              dragEnabled={itemSlot.dragEnabled}
                              onDragStart={itemSlot.onDragStart}
                              onDragEnd={itemSlot.onDragEnd}
                              onAction={(id: string) => base.value?.onRecordAction(id, record)}
                            />
                          )}
                          {slots.itemActions ? (
                            <div
                              onClick={(e: Event) => {
                                e.stopPropagation()
                              }}
                            >
                              {slots.itemActions(itemActionsSlot)}
                            </div>
                          ) : null}
                        </div>
                      </CardGrid>
                    )
                  })
                )}
              </div>
            ),
          }}
        />
      )
    }
  },
}) as unknown as QueryCardGridConstructor

export default QueryCardGrid
export type {
  QueryCardGridConstructor,
  QueryCardGridEmits,
  QueryCardGridProps,
  QueryCardGridSlots,
}

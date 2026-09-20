import {computed, defineComponent, type PropType, type Ref, ref, type SlotsType, toRef, unref, useModel, type VNode, watch,} from 'vue'
import {App, Card, Typography} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth} from '../crud-config-provider'
import {
  type RecordActionContext,
  type RecordActionDefinition,
  type RecordActionPayload,
  type ToolbarActionDefinition,
  type ToolbarActionPayload,
  buildRecordActionContext,
  BUILTIN_RECORD_ACTION_IDS,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultBulkActions, createDefaultItemActions} from '../_util/crud/defaultActions'
import {resolveRowKey} from '../_util/crud/rowKey'
import type {CardGridDragProp} from '../query-card-grid/types'
import {useCrudDelete} from '../_util/crud/useCrudDelete'

import QueryCardGrid from '../query-card-grid/QueryCardGrid'
import ActionButton from '../action-button'
import type {AuthorityProps, DefaultCrudEntity, RefreshOnActivate} from '../query-table/types'
import type {
  CardGridPagination,
  CrudCardGridConstructor,
  CrudCardGridEmits,
  CrudCardGridItemSlot,
  CrudCardGridProps,
  CrudCardGridRuntimeProps,
  CrudCardGridSlots,
  QueryCardGridExpose,
  QueryCardGridItemActionsSlot,
  QueryCardGridItemSlot,
} from '../query-card-grid/types'

const CRUD_CARD_GRID_EMITS = [
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
] as const

const CrudCardGrid = defineComponent({
  name: 'LCrudCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<CrudCardGridRuntimeProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    /** 卡片头：`VNode` 直接用、`false` 不要卡片头、不给走 `CrudConfig.resolveDefaultTitle` */
    title: [Object, Boolean] as PropType<VNode | boolean>,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ToolbarActionDefinition<DefaultCrudEntity>[]>,
    itemActions: Array as PropType<RecordActionDefinition<DefaultCrudEntity>[]>,
    recordActions: {type: Boolean, default: true},
    /** 拖拽开关 + 幽灵内容：`true` = 可拖（幽灵缺省主键）；`(record) => 内容` = 可拖且它就是幽灵 */
    drag: [Boolean, Function, Object] as PropType<CardGridDragProp<DefaultCrudEntity>>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    rowKey: [String, Function] as PropType<CrudCardGridRuntimeProps['rowKey']>,
    pagination: {
      type: [Object, Boolean] as PropType<CardGridPagination>,
      default: () => ({hideOnSinglePage: true}),
    },
    prefixCls: String,
    rootClass: String,
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedItems: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
  },
  emits: [...CRUD_CARD_GRID_EMITS],
  slots: Object as SlotsType<CrudCardGridSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TBody = DefaultCrudEntity
    type TId = string | number
    const {message, modal} = App.useApp()
    const locale = useLocale('Crud')
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const resolver = useActionResolver()
    const queryCardGrid = ref<QueryCardGridExpose<TEntity, TId>>()

    // 双向绑定：透传给 QueryCardGrid 时同时传值与 onUpdate，由最远端统一持有状态
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const selectedItems = useModel(props, 'selectedItems') as unknown as Ref<TEntity[]>
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const pagination = useModel(props, 'pagination') as unknown as Ref<CardGridPagination>

    const {remove} = useCrudDelete<TBody, TEntity, TId>({
      service: props.service,
      locale: () => locale.value,
      modal,
      message,
      loading,
      onDeleted: (records) => emit('deleted', records),
      refresh: () => queryCardGrid.value?.fetchDataSource(),
    })

    const gridActions = computed(() =>
      mergeDefinitions(
        createDefaultBulkActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove,
        }),
        props.actions ?? [],
      ),
    )

    const itemActionDefinitions = computed(() =>
      mergeDefinitions(
        createDefaultItemActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove,
          onEdit: (record) => emit('edit', record),
          onDetail: (record) => emit('detail', record),
        }),
        props.itemActions ?? [],
      ),
    )

    function buildRecordContext(record: TEntity): RecordActionContext<TEntity> {
      return buildRecordActionContext({record, app: {message, modal}})
    }

    function resolveRecordActions(record: TEntity) {
      return resolver.resolveRecordActions(itemActionDefinitions.value, buildRecordContext(record), auth)
    }

    function onRecordAction(id: string, record: TEntity) {
      if (BUILTIN_RECORD_ACTION_IDS.includes(id as (typeof BUILTIN_RECORD_ACTION_IDS)[number])) {
        return
      }
      emit('action', {id, context: buildRecordContext(record)})
    }

    function onGridAction(payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>) {
      if (payload.id === 'add') {
        emit('add')
      }
      emit('action', payload)
    }

    expose({
      fetchDataSource: () => queryCardGrid.value?.fetchDataSource(),
      remove,
    })

    return () => (
      <QueryCardGrid
        ref={queryCardGrid}
        {...attrs}
        service={props.service}
        rowKey={props.rowKey}
        title={props.title}
        hasPermission={props.hasPermission}
        actions={gridActions.value}
        drag={props.drag}
        gridColumns={props.gridColumns}
        selectable={props.selectable}
        authority={props.authority}
        immediate={props.immediate}
        refreshOnActivate={props.refreshOnActivate}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        dataSource={dataSource.value}
        loading={loading.value}
        query={query.value}
        selectedItems={selectedItems.value}
        pagination={pagination.value}
        onUpdate:dataSource={(value) => {
          dataSource.value = value
        }}
        onUpdate:loading={(value) => {
          loading.value = value
        }}
        onUpdate:query={(value) => {
          query.value = value
        }}
        onUpdate:selectedItems={(value) => {
          selectedItems.value = value
        }}
        onUpdate:pagination={(value) => {
          pagination.value = value
        }}
        onAction={onGridAction}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          empty: slots.empty ? () => slots.empty?.() : undefined,
          extra: slots.extra ? () => slots.extra?.() : undefined,
          item: (itemSlot: QueryCardGridItemSlot<TEntity>) => {
            if (slots.item) {
              const crudItemSlot: CrudCardGridItemSlot<TEntity> = {
                ...itemSlot,
                itemActions: props.recordActions ? resolveRecordActions(itemSlot.record) : [],
              }
              return slots.item(crudItemSlot)
            }
            if (!props.recordActions) {
              return null
            }
            return (
              <Card
                size="small"
                title={String(resolveRowKey(props.rowKey, itemSlot.record) ?? '')}
                v-slots={{
                  actions: () => (
                    <>
                      <div onClick={(e: Event) => e.stopPropagation()}>
                        <ActionButton
                          size="small"
                          type="text"
                          alwaysDropdown
                          actions={resolveRecordActions(itemSlot.record)}
                          onAction={(id: string) => onRecordAction(id, itemSlot.record)}
                        />
                      </div>
                      {itemSlot.dragEnabled ? (
                        <div
                          class={classNames(
                            `${props.prefixCls ?? 'loncra-query-card-grid'}-drag-handle`,
                          )}
                          draggable
                          onClick={(e: Event) => e.stopPropagation()}
                          onDragstart={itemSlot.onDragStart}
                          onDragend={itemSlot.onDragEnd}
                        >
                          <Typography.Text type="secondary">::</Typography.Text>
                        </div>
                      ) : null}
                    </>
                  ),
                }}
              />
            )
          },
          itemActions: slots.itemActions
            ? (itemActionsSlot: QueryCardGridItemActionsSlot<TEntity>) =>
                slots.itemActions?.({
                  ...itemActionsSlot,
                  actions: props.recordActions ? resolveRecordActions(itemActionsSlot.record) : [],
                })
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudCardGridConstructor

export default CrudCardGrid
export type {CrudCardGridConstructor, CrudCardGridEmits, CrudCardGridProps}

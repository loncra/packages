import {computed, defineComponent, type PropType, ref, type SlotsType, toRef, unref, watch,} from 'vue'
import {App, Card, Typography} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth} from '../crud-config-provider'
import {
  type ActionContext,
  type ActionDefinition,
  type ActionPayload,
  buildItemActionContext,
  BUILTIN_ITEM_ACTION_IDS,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultBulkActions, createDefaultItemActions} from '../_util/crud/defaultActions'
import {useCrudDelete} from '../_util/crud/useCrudDelete'
import QueryCardGrid from '../query-card-grid/QueryCardGrid'
import ActionButton from '../action-button'
import type {AuthorityProps, DefaultCrudEntity} from '../query-table/types'
import type {
  CardGridPagination,
  CrudCardGridConstructor,
  CrudCardGridEmits,
  CrudCardGridItemSlot,
  CrudCardGridProps,
  CrudCardGridRuntimeProps,
  CrudCardGridSlots,
  QueryCardGridExpose,
  QueryCardGridItemSlot,
  QueryCardGridSlots,
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
  'exported',
  'drop',
] as const

const CrudCardGrid = defineComponent({
  name: 'LCrudCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<CrudCardGridRuntimeProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    hideTitle: {type: Boolean, default: false},
    title: String,
    titleIcon: String,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    itemActions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    recordActions: {type: Boolean, default: true},
    actionContextExtras: Object as PropType<Record<string, unknown>>,
    drag: Boolean,
    dragDirection: {type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal'},
    formatDragPreview: Function as PropType<(record: DefaultCrudEntity) => string>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
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
    const {resolveActions} = useActionResolver()
    const queryCardGrid = ref<QueryCardGridExpose<TEntity, TId>>()

    const loadingInner = ref(props.loading ?? false)
    const selectedItemsInner = ref<TEntity[]>([...(props.selectedItems ?? [])])
    const dataSourceInner = ref<TEntity[]>([...(props.dataSource ?? [])])
    const queryInner = ref<FilterRequest | PageRequest>({...(props.query ?? {})})
    const paginationInner = ref<CardGridPagination>(props.pagination ?? {hideOnSinglePage: true})

    watch(
      () => props.loading,
      (value) => {
        loadingInner.value = value ?? false
      },
    )
    watch(
      () => props.selectedItems,
      (value) => {
        selectedItemsInner.value = value ?? []
      },
    )
    watch(
      () => props.dataSource,
      (value) => {
        dataSourceInner.value = value ?? []
      },
    )
    watch(
      () => props.query,
      (value) => {
        queryInner.value = value ?? {}
      },
    )
    watch(
      () => props.pagination,
      (value) => {
        paginationInner.value = value ?? {hideOnSinglePage: true}
      },
    )

    const loading = computed({
      get: () => loadingInner.value,
      set: (value: boolean) => {
        loadingInner.value = value
        emit('update:loading', value)
      },
    })
    const selectedItems = computed({
      get: () => selectedItemsInner.value,
      set: (value: TEntity[]) => {
        selectedItemsInner.value = value
        emit('update:selectedItems', value)
      },
    })
    const dataSource = computed({
      get: () => dataSourceInner.value,
      set: (value: TEntity[]) => {
        dataSourceInner.value = value
        emit('update:dataSource', value)
      },
    })
    const query = computed({
      get: () => queryInner.value,
      set: (value: FilterRequest | PageRequest) => {
        queryInner.value = value
        emit('update:query', value)
      },
    })
    const pagination = computed({
      get: () => paginationInner.value,
      set: (value: CardGridPagination) => {
        paginationInner.value = value
        emit('update:pagination', value)
      },
    })

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

    function buildItemContext(record: TEntity): ActionContext<TEntity> {
      return buildItemActionContext({
        record,
        toolbarContext: unref(queryCardGrid.value?.actionContext),
        actionContextExtras: props.actionContextExtras,
      })
    }

    function resolveItemActions(record: TEntity) {
      return resolveActions(itemActionDefinitions.value, buildItemContext(record), auth)
    }

    function onItemAction(id: string, record: TEntity) {
      if (BUILTIN_ITEM_ACTION_IDS.includes(id as (typeof BUILTIN_ITEM_ACTION_IDS)[number])) {
        return
      }
      emit('action', {id, context: buildItemContext(record)})
    }

    function onGridAction(payload: ActionPayload<TEntity>) {
      if (payload.id === 'add') {
        emit('add')
      }
      emit('action', payload)
    }

    expose({
      fetchDataSource: () => queryCardGrid.value?.fetchDataSource(),
      exportData: () => queryCardGrid.value?.exportData(selectedItems.value),
      remove,
    })

    return () => (
      <QueryCardGrid
        ref={queryCardGrid}
        {...attrs}
        service={props.service}
        hideTitle={props.hideTitle}
        title={props.title}
        titleIcon={props.titleIcon}
        hasPermission={props.hasPermission}
        actions={gridActions.value}
        actionContextExtras={props.actionContextExtras}
        drag={props.drag}
        formatDragPreview={props.formatDragPreview}
        dragDirection={props.dragDirection}
        gridColumns={props.gridColumns}
        selectable={props.selectable}
        authority={props.authority}
        immediate={props.immediate}
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
        onExported={(result) => emit('exported', result)}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          empty: slots.empty ? () => slots.empty?.() : undefined,
          extra: slots.extra ? () => slots.extra?.() : undefined,
          item: (itemSlot: QueryCardGridItemSlot<TEntity>) => {
            if (slots.item) {
              const crudItemSlot: CrudCardGridItemSlot<TEntity> = {
                ...itemSlot,
                itemActions: props.recordActions ? resolveItemActions(itemSlot.record) : [],
              }
              return slots.item(crudItemSlot)
            }
            if (!props.recordActions) {
              return null
            }
            if (slots.itemActions) {
              return slots.itemActions({
                record: itemSlot.record,
                index: itemSlot.index,
                dragEnabled: itemSlot.dragEnabled,
                onDragStart: itemSlot.onDragStart,
                onDragEnd: itemSlot.onDragEnd,
                actions: resolveItemActions(itemSlot.record),
              })
            }
            return (
              <Card
                size="small"
                title={String(itemSlot.record[SYSTEM_CONSTANT.ID_NAME] ?? '')}
                v-slots={{
                  actions: () => (
                    <>
                      <div onClick={(e: Event) => e.stopPropagation()}>
                        <ActionButton
                          size="small"
                          type="text"
                          alwaysDropdown
                          actions={resolveItemActions(itemSlot.record)}
                          onAction={(id: string) => onItemAction(id, itemSlot.record)}
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
            ? (itemActionsSlot: Parameters<NonNullable<QueryCardGridSlots<TEntity>['itemActions']>>[0]) =>
                slots.itemActions?.(itemActionsSlot)
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudCardGridConstructor

export default CrudCardGrid
export type {CrudCardGridConstructor, CrudCardGridEmits, CrudCardGridProps}

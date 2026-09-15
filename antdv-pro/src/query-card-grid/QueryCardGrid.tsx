import {
  computed,
  defineComponent,
  onActivated,
  onMounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  toRef,
  watch,
} from 'vue'
import {App, Card, CardGrid, Empty, Flex, Pagination, Space, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, renderIconFont} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth, useCrudConfig} from '../crud-config-provider'
import {
  ACTION_CONTEXT_KEY,
  type ActionContext,
  type ActionDefinition,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultToolbarActions} from '../_util/crud/defaultActions'
import {exportCollectionData, fetchCollectionData} from '../_util/crud/useCollectionData'
import {useFlatDragDrop} from '../_util/crud/useFlatDragDrop'
import ActionButton from '../action-button'
import useStyle from './style'
import type {AuthorityProps, DefaultCrudEntity} from '../query-table/types'
import type {
  CardGridPagination,
  QueryCardGridConstructor,
  QueryCardGridEmits,
  QueryCardGridExpose,
  QueryCardGridItemSlot,
  QueryCardGridProps,
  QueryCardGridRuntimeProps,
  QueryCardGridSlots,
} from './types'

const QUERY_CARD_GRID_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedItems',
  'update:pagination',
  'action',
  'exported',
  'drop',
] as const

const QueryCardGrid = defineComponent({
  name: 'LQueryCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryCardGridRuntimeProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    hideTitle: {type: Boolean, default: false},
    title: String,
    titleIcon: String,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    actionContextExtras: Object as PropType<Record<string, unknown>>,
    drag: Boolean,
    dragDirection: {type: String as PropType<'horizontal' | 'vertical'>, default: 'horizontal'},
    formatDragPreview: Function as PropType<(record: DefaultCrudEntity) => string>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    pagination: {
      type: [Object, Boolean] as PropType<CardGridPagination>,
      default: () => ({hideOnSinglePage: true, align: 'center'}),
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
  emits: [...QUERY_CARD_GRID_EMITS],
  slots: Object as SlotsType<QueryCardGridSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number
    const {message} = App.useApp()
    const locale = useLocale('Crud')
    const config = useConfig()
    const crudConfig = useCrudConfig()
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const {resolveActions} = useActionResolver()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('query-card-grid', props.prefixCls ?? 'loncra-query-card-grid'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const dataSourceInner = ref<TEntity[]>([...(props.dataSource ?? [])])
    const loadingInner = ref(props.loading ?? false)
    const queryInner = ref<FilterRequest | PageRequest>({...(props.query ?? {})})
    const selectedItemsInner = ref<TEntity[]>([...(props.selectedItems ?? [])])
    const paginationInner = ref<CardGridPagination>(
      props.pagination ?? {hideOnSinglePage: true, align: 'center'},
    )

    watch(
      () => props.dataSource,
      (value) => {
        dataSourceInner.value = value ?? []
      },
    )
    watch(
      () => props.loading,
      (value) => {
        loadingInner.value = value ?? false
      },
    )
    watch(
      () => props.query,
      (value) => {
        queryInner.value = value ?? {}
      },
    )
    watch(
      () => props.selectedItems,
      (value) => {
        selectedItemsInner.value = value ?? []
      },
    )
    watch(
      () => props.pagination,
      (value) => {
        paginationInner.value = value ?? {hideOnSinglePage: true, align: 'center'}
      },
    )

    const dataSource = computed({
      get: () => dataSourceInner.value,
      set: (value: TEntity[]) => {
        dataSourceInner.value = value
        emit('update:dataSource', value)
      },
    })
    const loading = computed({
      get: () => loadingInner.value,
      set: (value: boolean) => {
        loadingInner.value = value
        emit('update:loading', value)
      },
    })
    const query = computed({
      get: () => queryInner.value,
      set: (value: FilterRequest | PageRequest) => {
        queryInner.value = value
        emit('update:query', value)
      },
    })
    const selectedItems = computed({
      get: () => selectedItemsInner.value,
      set: (value: TEntity[]) => {
        selectedItemsInner.value = value
        emit('update:selectedItems', value)
      },
    })
    const pagination = computed({
      get: () => paginationInner.value,
      set: (value: CardGridPagination) => {
        paginationInner.value = value
        emit('update:pagination', value)
      },
    })

    const hasFetched = ref(false)
    const dragEnabled = computed(() => !!props.drag)
    const ghostClass = computed(() =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
    )
    const dropClassPrefix = computed(() => classNames(hashId.value, prefixCls.value))

    const {onDragHandleStart, onDragHandleEnd, buildDropZoneProps, dropTargetClass} = useFlatDragDrop<
      TEntity,
      TId
    >({
      drag: dragEnabled,
      dataSource,
      direction: props.dragDirection,
      formatDragPreview: (record) =>
        props.formatDragPreview?.(record) ?? String(record[SYSTEM_CONSTANT.ID_NAME] ?? ''),
      ghostClass,
      dropClassPrefix,
      onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
        emit('drop', sorts, target, fromIndex, toIndex),
    })

    const actionContext = computed<ActionContext<TEntity>>(() => ({
      scope: 'toolbar',
      items: dataSource.value,
      selectedItems: selectedItems.value,
      query: query.value,
      extras: props.actionContextExtras ?? {},
    }))

    provide(ACTION_CONTEXT_KEY, actionContext)

    const defaultToolbarActions = computed(() =>
      createDefaultToolbarActions<TEntity>({
        authority: props.authority,
        locale: locale.value,
        iconClass: 'align',
        onAdd: (ctx) => emit('action', {id: 'add', context: ctx}),
        onExport: (ctx) => exportData(ctx.selectedItems),
      }),
    )

    const titleActions = computed(() =>
      resolveActions(
        mergeDefinitions(defaultToolbarActions.value, props.actions ?? []),
        actionContext.value,
        auth,
      ),
    )

    const resolvedTitle = computed(() => {
      if (props.title !== undefined || props.titleIcon !== undefined) {
        return {title: props.title ?? '', icon: props.titleIcon ?? 'loncra-file'}
      }
      const fromConfig = crudConfig.value.resolveDefaultTitle?.()
      return {title: fromConfig?.title ?? '', icon: fromConfig?.icon ?? 'loncra-file'}
    })

    const paginationBindProps = computed(() => {
      if (pagination.value === false) {
        return {}
      }
      return pagination.value
    })

    function isSelected(record: TEntity) {
      const id = record[SYSTEM_CONSTANT.ID_NAME]
      return selectedItems.value.some((item) => item[SYSTEM_CONSTANT.ID_NAME] === id)
    }

    function onSelect(record: TEntity) {
      if (!props.selectable) {
        return
      }
      if (isSelected(record)) {
        const id = record[SYSTEM_CONSTANT.ID_NAME]
        selectedItems.value = selectedItems.value.filter(
          (item) => item[SYSTEM_CONSTANT.ID_NAME] !== id,
        )
      } else {
        selectedItems.value = [...selectedItems.value, record]
      }
    }

    async function fetchDataSource() {
      try {
        loading.value = true
        dataSource.value = await fetchCollectionData({
          service: props.service,
          query: query.value,
          pagination: pagination as never,
        })
      } finally {
        loading.value = false
      }
    }

    async function exportData(records: TEntity[]) {
      const result = await exportCollectionData({
        service: props.service,
        query: query.value,
        records,
      })
      message.success(result.message)
      emit('exported', result)
      crudConfig.value.onExported?.(result)
    }

    function onChangePage(page: number, pageSize: number) {
      query.value = {...query.value, number: page, size: pageSize}
      void fetchDataSource()
    }

    onMounted(async () => {
      if (props.immediate !== false) {
        await fetchDataSource()
      }
      hasFetched.value = true
    })

    onActivated(() => {
      if (!hasFetched.value) {
        return
      }
      void fetchDataSource()
    })

    expose<QueryCardGridExpose<TEntity, TId>>({
      fetchDataSource,
      exportData,
      actionContext,
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...restAttrs} = attrs
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const rootStyle = {
        ...(typeof attrStyle === 'object' && attrStyle ? attrStyle : {}),
        '--loncra-card-grid-columns': String(props.gridColumns ?? 5),
      }

      const renderTitle = () => (
        <Flex
          justify="space-between"
          align="center"
          class={classNames(hashId.value, `${prefixCls.value}-title`)}
        >
          {slots.title ? (
            slots.title()
          ) : (
            <Space>
              {renderIconFont(resolvedTitle.value.icon, 'align')}
              <Typography.Text strong>{resolvedTitle.value.title}</Typography.Text>
            </Space>
          )}
          {slots.extra ? slots.extra() : <ActionButton size="small" actions={titleActions.value} />}
        </Flex>
      )

      return (
        <Card
          {...restAttrs}
          size="small"
          class={hashedClass}
          style={rootStyle}
          loading={loading.value}
          v-slots={{
            title: props.hideTitle ? undefined : renderTitle,
          }}
        >
          {(dataSource.value || []).length <= 0 ? (
            slots.empty ? (
              slots.empty()
            ) : (
              <Empty />
            )
          ) : (
            dataSource.value.map((record, index) => {
              const itemSlot: QueryCardGridItemSlot<TEntity> = {
                record,
                index,
                selected: isSelected(record),
                dragEnabled: dragEnabled.value,
                onDragStart: (event: DragEvent) => onDragHandleStart(record, event),
                onDragEnd: onDragHandleEnd,
              }
              return (
                <CardGrid
                  key={String(record[SYSTEM_CONSTANT.ID_NAME] ?? index)}
                  class={classNames(
                    hashId.value,
                    `${prefixCls.value}-item`,
                    isSelected(record) && `${prefixCls.value}-item-selected`,
                    dropTargetClass(record),
                  )}
                >
                  <div
                    {...buildDropZoneProps(record)}
                    onClick={() => onSelect(record)}
                  >
                    {slots.item?.(itemSlot)}
                    {slots.itemActions ? (
                      <div
                        onClick={(e: Event) => {
                          e.stopPropagation()
                        }}
                      >
                        {slots.itemActions?.({
                          record,
                          index,
                          dragEnabled: dragEnabled.value,
                          onDragStart: itemSlot.onDragStart,
                          onDragEnd: onDragHandleEnd,
                        })}
                      </div>
                    ) : null}
                  </div>
                </CardGrid>
              )
            })
          )}
          {pagination.value !== false ? (
            <Pagination
              class={classNames(hashId.value, `${prefixCls.value}-pagination`)}
              {...(paginationBindProps.value as Record<string, unknown>)}
              onChange={onChangePage}
            />
          ) : null}
        </Card>
      )
    }
  },
}) as unknown as QueryCardGridConstructor

export default QueryCardGrid
export type {
  QueryCardGridConstructor,
  QueryCardGridEmits,
  QueryCardGridExpose,
  QueryCardGridProps,
  QueryCardGridSlots,
}

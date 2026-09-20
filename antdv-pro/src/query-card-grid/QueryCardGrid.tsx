import {
  computed,
  defineComponent,
  onActivated,
  onMounted,
  type PropType,
  type Ref,
  ref,
  type SlotsType,
  toRef,
  useModel,
} from 'vue'
import {App, Card, CardGrid, Empty, Flex, Pagination, Space, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, renderIconFont} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth, useCrudConfig} from '../crud-config-provider'
import {
  type ToolbarActionContext,
  type ToolbarActionDefinition,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultToolbarActions} from '../_util/crud/defaultActions'
import {resolveRowKey} from '../_util/crud/rowKey'
import {fetchCollectionData} from '../_util/crud/useCollectionData'
import {isDragEnabled, type DragProp} from '../_util/crud/useDrag'
import {useFlatDragDrop} from '../_util/crud/useFlatDragDrop'
import ActionButton from '../action-button'
import useStyle from './style'
import type {AuthorityProps, DefaultCrudEntity, RefreshOnActivate} from '../query-table/types'
import type {
  CardGridDragDirection,
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
  'drop',
] as const

const QueryCardGrid = defineComponent({
  name: 'LQueryCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryCardGridRuntimeProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    /** 卡片头：`VNode` 直接用、`false` 不要卡片头、不给走 `CrudConfig.resolveDefaultTitle` */
    title: [Object, Boolean] as PropType<QueryCardGridRuntimeProps['title']>,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ToolbarActionDefinition<DefaultCrudEntity>[]>,
    /**
     * 拖拽开关 + 幽灵内容（同表格）；要给方向就写对象形态 `{dragPreview, direction}`，那时 `direction` 才生效
     */
    drag: [Boolean, Function, Object] as PropType<QueryCardGridRuntimeProps['drag']>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    rowKey: [String, Function] as PropType<QueryCardGridRuntimeProps['rowKey']>,
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
    const {message, modal} = App.useApp()
    const locale = useLocale('Crud')
    const config = useConfig()
    const crudConfig = useCrudConfig()
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const {resolveToolbarActions} = useActionResolver()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('query-card-grid', props.prefixCls ?? 'loncra-query-card-grid'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    // 双向绑定：父级 v-model 时纯受控（写操作 emit 回流），未绑时写本地值并 emit。
    // localValue 与 props 保持同一引用，父级「改对象属性」也能立即生效（不再需要 watch 拷贝）。
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const selectedItems = useModel(props, 'selectedItems') as unknown as Ref<TEntity[]>
    const pagination = useModel(props, 'pagination') as unknown as Ref<CardGridPagination>

    const mountedFetched = ref(false)
    /** `drag` 两种形态归一：对象形态才关心方向，否则按横向 */
    const dragPreview = computed((): DragProp<TEntity> | undefined =>
      typeof props.drag === 'object' ? props.drag.dragPreview : props.drag,
    )
    const dragDirection = computed((): CardGridDragDirection =>
      typeof props.drag === 'object' ? props.drag.direction : 'horizontal',
    )
    const dragEnabled = computed(() => isDragEnabled(dragPreview.value))
    const ghostClass = computed(() =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
    )
    const dropClassPrefix = computed(() => classNames(hashId.value, prefixCls.value))

    const {onDragHandleStart, onDragHandleEnd, buildDropZoneProps, dropTargetClass} = useFlatDragDrop<
      TEntity,
      TId
    >({
      drag: dragPreview,
      // 拖拽的同一性判断也要跟 rowKey 对齐（rowKey 是函数时拿不到字段名，回退 id）
      idKey: (typeof props.rowKey === 'string' ? props.rowKey : undefined) as keyof TEntity & string | undefined,
      dataSource,
      direction: dragDirection.value,
      ghostClass,
      dropClassPrefix,
      onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
        emit('drop', sorts, target, fromIndex, toIndex),
    })

    const actionContext = computed<ToolbarActionContext<TEntity>>(() => ({
      items: dataSource.value,
      selectedItems: selectedItems.value,
      query: query.value,
      message,
      modal,
    }))

    const defaultToolbarActions = computed(() =>
      createDefaultToolbarActions<TEntity>({
        authority: props.authority,
        locale: locale.value,
        iconClass: 'align',
        onAdd: (ctx) => emit('action', {id: 'add', context: ctx}),
      }),
    )

    const titleActions = computed(() =>
      resolveToolbarActions(
        mergeDefinitions(defaultToolbarActions.value, props.actions ?? []),
        actionContext.value,
        auth,
      ),
    )

    /** 没给 `title`（或给了 `true`）时的卡片头内容：走宿主配的默认标题 */
    const resolvedTitle = computed(() => {
      const fromConfig = crudConfig.value.resolveDefaultTitle?.()
      return {title: fromConfig?.title ?? '', icon: fromConfig?.icon}
    })

    const paginationBindProps = computed(() => {
      if (pagination.value === false) {
        return {}
      }
      return pagination.value
    })

    function isSelected(record: TEntity) {
      const id = resolveRowKey(props.rowKey, record)
      return selectedItems.value.some((item) => resolveRowKey(props.rowKey, item) === id)
    }

    function onSelect(record: TEntity) {
      if (!props.selectable) {
        return
      }
      if (isSelected(record)) {
        const id = resolveRowKey(props.rowKey, record)
        selectedItems.value = selectedItems.value.filter(
          (item) => resolveRowKey(props.rowKey, item) !== id,
        )
      } else {
        selectedItems.value = [...selectedItems.value, record]
      }
    }

    async function fetchDataSource() {
      loading.value = true
      try {
        dataSource.value = await fetchCollectionData({
          service: props.service,
          query: query.value,
          pagination: pagination as never,
        })
      } finally {
        loading.value = false
      }
    }

    function onChangePage(page: number, pageSize: number) {
      query.value = {...query.value, number: page, size: pageSize}
      void fetchDataSource()
    }

    onMounted(async () => {
      if (!props.immediate) {
        return
      }
      await fetchDataSource()
    })

    onActivated(() => {
      // onActivated 在首次挂载时也会触发，那一次交给 onMounted / immediate 决定
      if (!mountedFetched.value) {
        mountedFetched.value = true
        return
      }
      const refresh = props.refreshOnActivate
      if (refresh === false) {
        return
      }
      if (typeof refresh === 'function') {
        void refresh()
        return
      }
      void fetchDataSource()
    })

    expose<QueryCardGridExpose<TEntity, TId>>({
      fetchDataSource,
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
          ) : typeof props.title === 'object' && props.title !== null ? (
            props.title
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
            title: props.title === false ? undefined : renderTitle,
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
                  key={String(resolveRowKey(props.rowKey, record) ?? index)}
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

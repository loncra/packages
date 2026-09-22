import {
  computed,
  type CSSProperties,
  defineComponent,
  type PropType,
  type Ref,
  ref,
  type SlotsType,
  useModel,
} from 'vue'
import {Card, CardGrid, Empty, Typography} from 'antdv-next'
import type {TableProps} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, splitSemantic} from '@loncra/antdv'
import {type FilterRequest, type PageRequest} from '@loncra/client/commons'
import BasicCrudQuery from '../basic-crud-query'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
} from '../_util/crud/useCollectionData'
import type {BasicCrudQueryExpose, RefreshOnActivate} from '../basic-crud-query/types'
import {resolveRowKey} from '../_util/crud/rowKey'
import {isDragEnabled, type DragProp} from '../_util/crud/useDrag'
import {useFlatDragDrop} from '../_util/crud/useFlatDragDrop'
import ActionButton from '../action-button'
import useStyle from './style'
import type {
  CardGridDragDirection,
  QueryCardGridConstructor,
  QueryCardGridEmits,
  QueryCardGridItemActionsSlot,
  QueryCardGridItemSlot,
  QueryCardGridProps,
  QueryCardGridSlots,
} from './types'

const QUERY_CARD_GRID_EMITS = [
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

/** 语义 map 的部件表（键前缀）：`cardGrid.` 是网格容器/项，不带前缀的算卡片本体（见 `splitSemantic`） */
const SEMANTIC_PARTS = ['card', 'cardGrid'] as const

/**
 * **内容层**：只负责"卡片网格怎么画" —— 网格排布、选中、拖拽落点、`item` / `itemActions` 槽。
 *
 * 数据 / 标题 / 统一分页 / 工具条·批量·项内动作的解析都在 `BasicCrudQuery` 基类里：
 * 本组件把"交给基类"的那几个 props 原样转发，并用 `v-model` 与基类共用同一份数据；
 * 需要基类的能力（行内动作解析、删除）走它 expose 的口。
 */
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
    /**
     * 卡片头（转发给基类）：`VNode` 直接用、`false` 不要卡片头、不给走 `CrudConfig.resolveDefaultTitle`。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"会被 Vue 的布尔转换变成
     * `false`（= "不要卡片头"）⇒ 默认标题与工具栏都没了。
     */
    title: {type: [Object, Boolean] as PropType<QueryCardGridProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    /**
     * 标题右侧的工具栏动作（转发给基类）：数组 = 与默认合并；`false` = 整排不出。
     *
     * ⚠️ **`default: undefined` 不能删**（与 `title` 同一个坑）：不传会被 Vue 的布尔转换变成 `false`。
     */
    toolbarActions: {
      type: [Array, Boolean] as PropType<QueryCardGridProps['toolbarActions']>,
      default: undefined,
    },
    /** 项内动作（转发给基类）：数组 = 与默认合并；`false` = 不要（同样不能删 `default: undefined`） */
    recordActions: {
      type: [Array, Boolean] as PropType<QueryCardGridProps['recordActions']>,
      default: undefined,
    },
    /**
     * 拖拽开关 + 幽灵内容（同表格）；要给方向就写对象形态 `{dragPreview, direction}`，那时 `direction` 才生效
     */
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
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('query-card-grid', props.prefixCls ?? 'loncra-query-card-grid'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    /** 内核（数据 / 标题 / 分页 / 动作解析）在基类，这里只读它的 expose */
    const base = ref<BasicCrudQueryExpose<TEntity, TId>>()

    // 与基类共用同一份值：父级 v-model 时纯受控（写操作 emit 回流），未绑时写本地值并 emit
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const selectedItems = useModel(props, 'selectedItems') as unknown as Ref<TEntity[]>
    const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>

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

    /** 项内动作：解析在基类（它持有 `remove` / 权限 / 运行态），这里只取结果放进槽参数 */
    function itemActionsOf(record: TEntity) {
      return base.value?.resolveRecordActions(record) ?? []
    }

    /** 没给 `#item` 时的兜底卡：主键当标题 + 动作行（含拖拽把手） */
    function defaultItem(slot: QueryCardGridItemSlot<TEntity>) {
      if (props.recordActions === false) {
        return null
      }
      return (
        <Card
          size="small"
          title={String(resolveRowKey(props.rowKey, slot.record) ?? '')}
          v-slots={{
            actions: () => (
              <>
                <div onClick={(e: Event) => e.stopPropagation()}>
                  <ActionButton
                    size="small"
                    type="text"
                    alwaysDropdown
                    actions={slot.itemActions}
                    onAction={(id: string) => base.value?.onRecordAction(id, slot.record)}
                  />
                </div>
                {slot.dragEnabled ? (
                  <div
                    class={classNames(`${prefixCls.value}-drag-handle`)}
                    draggable
                    onClick={(e: Event) => e.stopPropagation()}
                    onDragstart={slot.onDragStart}
                    onDragend={slot.onDragEnd}
                  >
                    <Typography.Text type="secondary">::</Typography.Text>
                  </div>
                ) : null}
              </>
            ),
          }}
        />
      )
    }

    expose<CollectionExpose<TEntity>>({
      fetchDataSource: async () => base.value?.fetchDataSource(),
      remove: (records) => base.value?.remove(records),
    })

    return () => {
      const {
        class: attrClass,
        style: attrStyle,
        classes: attrClasses,
        styles: attrStyles,
        ...restAttrs
      } = attrs
      /**
       * 语义样式按部件拆（键前缀见 `SEMANTIC_PARTS`）：`cardGrid.` 落我们自己的网格容器与每一项
       * （`CardGrid` 官方没有语义类，只能挂自己的节点上）。
       */
      const classSemantic = splitSemantic(
        attrClasses as Record<string, string> | undefined,
        SEMANTIC_PARTS,
        'card',
      )
      const styleSemantic = splitSemantic(
        attrStyles as Record<string, unknown> | undefined,
        SEMANTIC_PARTS,
        'card',
      )
      const gridClasses = classSemantic.cardGrid
      const gridStyles = styleSemantic.cardGrid
      // 壳（Card）在基类那侧：尺寸、类名、CSS 变量都经 attrs 通道挂到 Card 上（宿主自给的以宿主为准）
      const shellAttrs = {size: 'small', ...restAttrs}
      const shellClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass,
      )
      const shellStyle = {
        ...(typeof attrStyle === 'object' && attrStyle ? attrStyle : {}),
        '--loncra-card-grid-columns': String(props.gridColumns ?? 5),
      }

      return (
        <BasicCrudQuery
          ref={base}
          {...shellAttrs}
          {...({classes: classSemantic.card, styles: styleSemantic.card} as Record<string, unknown>)}
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
          selectedKey="selectedItems"
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
          onAdd={() => emit('add')}
          onEdit={(record: TEntity) => emit('edit', record)}
          onDetail={(record: TEntity) => emit('detail', record)}
          onDeleted={(records: TEntity[]) => emit('deleted', records)}
          onAction={(payload) => emit('action', payload)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            default: () => (
              <div
                class={classNames(hashId.value, `${prefixCls.value}-grid`, gridClasses?.root)}
                style={gridStyles?.root as CSSProperties | undefined}
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
                      itemActions: itemActionsOf(record),
                    }
                    const itemActionsSlot: QueryCardGridItemActionsSlot<TEntity> = {
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
                          hashId.value,
                          `${prefixCls.value}-item`,
                          isSelected(record) && `${prefixCls.value}-item-selected`,
                          dropTargetClass(record),
                          gridClasses?.item,
                        )}
                        style={gridStyles?.item as CSSProperties | undefined}
                      >
                        <div
                          {...buildDropZoneProps(record)}
                          onClick={() => onSelect(record)}
                        >
                          {slots.item ? slots.item(itemSlot) : defaultItem(itemSlot)}
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

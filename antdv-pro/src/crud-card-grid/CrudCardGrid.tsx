import {defineComponent, type PropType, type Ref, ref, type SlotsType, useModel} from 'vue'
import type {TableProps} from 'antdv-next'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import QueryCardGrid from '../query-card-grid/QueryCardGrid'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {DefaultCrudEntity} from '../_util/crud/useCollectionData'
import type {RefreshOnActivate} from '../basic-crud-query/types'
import type {
  QueryCardGridItemActionsSlot,
  QueryCardGridItemSlot,
  QueryCardGridSlots,
} from '../query-card-grid/types'
import type {CrudCardGridConstructor, CrudCardGridProps} from './types'

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

/**
 * 卡片网格的**门面**：对外名字保持旧样（`:actions` / `:item-actions` / `record-actions` 开关），
 * 内部一律映射进内容层（`QueryCardGrid`）—— 数据、标题、分页、动作解析都在基类里，这里不做事。
 */
const CrudCardGrid = defineComponent({
  name: 'LCrudCardGrid',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<CrudCardGridProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    /**
     * 卡片头：`VNode` 直接用、`false` 不要卡片头、不给走 `CrudConfig.resolveDefaultTitle`。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"会被 Vue 的布尔转换变成
     * `false`（= "不要卡片头"）⇒ 默认标题与工具栏都没了。
     */
    title: {type: [Object, Boolean] as PropType<CrudCardGridProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    /**
     * 标题右侧的工具栏动作（旧名 → `toolbarActions`）：`false` = 整排不出。
     *
     * ⚠️ **`default: undefined` 不能删**（与 `title` 同一个坑）：不传会被转成 `false` ⇒ 整排不出。
     */
    actions: {type: [Array, Boolean] as PropType<CrudCardGridProps['actions']>, default: undefined},
    /** 项内动作定义（旧名 → `recordActions`） */
    itemActions: Array as PropType<CrudCardGridProps['itemActions']>,
    /** 是否要项内动作（开关 → `recordActions: false | 数组`） */
    recordActions: {type: Boolean, default: true},
    /** 拖拽开关 + 幽灵内容：`true` = 可拖（幽灵缺省主键）；`(record) => 内容` = 可拖且它就是幽灵 */
    drag: [Boolean, Function, Object] as PropType<CrudCardGridProps['drag']>,
    gridColumns: {type: Number, default: 5},
    selectable: {type: Boolean, default: true},
    rowKey: [String, Function] as PropType<CrudCardGridProps['rowKey']>,
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
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
  slots: Object as SlotsType<QueryCardGridSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number
    const grid = ref<CollectionExpose<TEntity>>()

    // 双向绑定：本层持有值（宿主不绑 v-model 时也有本地值），往下一层同时传值与 onUpdate
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const selectedItems = useModel(props, 'selectedItems') as unknown as Ref<TEntity[]>
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>

    expose<CollectionExpose<TEntity>>({
      fetchDataSource: async () => grid.value?.fetchDataSource(),
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
        toolbarActions={props.actions}
        recordActions={props.recordActions ? (props.itemActions ?? []) : false}
        drag={props.drag}
        gridColumns={props.gridColumns}
        selectable={props.selectable}
        rowKey={props.rowKey}
        pagination={pagination.value}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        dataSource={dataSource.value}
        loading={loading.value}
        query={query.value}
        selectedItems={selectedItems.value}
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
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          extra: slots.extra ? () => slots.extra?.() : undefined,
          empty: slots.empty ? () => slots.empty?.() : undefined,
          item: slots.item
            ? (slot: QueryCardGridItemSlot<TEntity>) => slots.item?.(slot)
            : undefined,
          itemActions: slots.itemActions
            ? (slot: QueryCardGridItemActionsSlot<TEntity>) => slots.itemActions?.(slot)
            : undefined,
        }}
      />
    )
  },
}) as unknown as CrudCardGridConstructor

export default CrudCardGrid
export type {CrudCardGridConstructor, CrudCardGridProps}

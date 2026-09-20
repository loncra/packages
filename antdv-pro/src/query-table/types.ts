import type {Component, EmitsToProps, PublicProps, VNode} from 'vue'
import type {TableProps} from 'antdv-next'
import type {ColumnType} from 'antdv-next/dist/table/interface'
import {
  type BasicIdMetadata,
  type DropPosition,
  type FilterRequest,
  type PageRequest,
  type ScrollPageResult,
  SYSTEM_CONSTANT,
  type TreeSortMetadata,
} from '@loncra/client/commons'
import type {
  RecordActionDefinition,
  RecordActionPayload,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionPagination, CollectionService} from '../_util/crud/useCollectionData'
import type {DragPreviewContent, DragProp} from '../_util/crud/useDrag'

/** 未指定业务实体时的回退：只保证有 id，对标 commons BasicIdMetadata */
export type DefaultCrudEntity = BasicIdMetadata<string | number>

export interface ColumnSearchConfig {
  component?: Component
  props?: Record<string, unknown>
  expression?: string
  queryName?: string
  defaultValue?: unknown
}

export type SearchableColumnType<RecordType extends object = DefaultCrudEntity> =
  ColumnType<RecordType> & {
    search?: ColumnSearchConfig
  }

export interface AuthorityProps {
  add?: string | boolean
  edit?: string | boolean
  detail?: string | boolean
  delete?: string | boolean
}

/**
 * 被 KeepAlive 缓存的实例从缓存切回（onActivated）时如何刷新数据。
 * - `true`（默认）：自动重新取数
 * - `false`：切回不刷新
 * - 函数：完全交给调用方决定（组件不再自动取数），需要的数据请自行通过 v-model 绑定获取
 */
export type RefreshOnActivate = boolean | (() => void | Promise<void>)

export interface QueryCollectionProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  immediate?: boolean
  refreshOnActivate?: RefreshOnActivate
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  actions?: ToolbarActionDefinition<TEntity>[]
  /**
   * 拖拽开关 + 幽灵内容（一个口两件事）：`true` = 可拖（幽灵缺省是主键）；
   * `(record) => 内容` = 可拖且它就是幽灵；`false` / 不给 = 不可拖。
   */
  drag?: DragProp<TEntity>
  prefixCls?: string
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  /** 主键字段名（或 antd 的取键函数）；缺省用 `SYSTEM_CONSTANT.ID_NAME`。表与卡片网格共用 */
  rowKey?: TableProps['rowKey']
}

/**
 * **内容层** props：表格自己画什么。
 *
 * 数据 / 分页 / 字典 / 标题 / 动作在 `BasicCrudQuery` 基类里，这里只是把"交给基类"的那几个
 * 原样转发（名字与基类一致），数据用 `v-model` 双向绑定。
 */
export interface QueryTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  columns?: SearchableColumnType<TEntity>[]
  immediate?: boolean
  refreshOnActivate?: RefreshOnActivate
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  /** 标题右侧的工具栏动作：数组 = 与默认 `add`/`deleteSelected` 合并；`false` = 整排不出 */
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  /** 行内动作：数组 = 与默认 `edit`/`detail`/`delete` 合并；`false` = 不要（`操作`列也不补） */
  recordActions?: RecordActionDefinition<TEntity>[] | false
  bordered?: boolean
  /** 拖拽开关 + 幽灵内容（同 `QueryCollectionProps.drag`） */
  drag?: DragProp<TEntity>
  onRow?: TableProps['onRow']
  rowKey?: TableProps['rowKey']
  rowSelection?: TableProps['rowSelection'] | false
  pagination?: TableProps['pagination']
  prefixCls?: string
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  selectedRows?: TEntity[]
}

export type QueryTableEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = {
  'update:dataSource': [value: TEntity[]]
  'update:loading': [value: boolean]
  'update:query': [value: FilterRequest | PageRequest]
  'update:selectedRows': [value: TEntity[]]
  'update:pagination': [value: TableProps['pagination']]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
  treeDrop: [
    sorts: TreeSortMetadata<TId>[],
    drag: TEntity,
    target: TEntity,
    payload: {dropPosition: DropPosition; tree: TEntity[]},
  ]
}

export interface QueryTableSlots<TEntity extends object> {
  title?: () => unknown
  bodyCell?: (args: {
    text: unknown
    record: TEntity
    index: number
    column: SearchableColumnType<TEntity>
  }) => unknown
  expandedRowRender?: (args: {
    record: TEntity
    index: number
    indent: number
    expanded: boolean
  }) => unknown
}

export interface QueryTableExpose<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  fetchDataSource: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}

/** 控件实现侧用的具体 props；调用方仍走下面的 constructor 泛型 */
export type QueryTableRuntimeProps = QueryTableProps<
  DefaultCrudEntity,
  DefaultCrudEntity,
  ScrollPageResult<DefaultCrudEntity>,
  string | number
>

/**
 * Vue 3.5 的 defineComponent 函数重载接不住泛型 setup。
 * 实现用对象形 defineComponent，导出时断言成这个 constructor，调用方才能带实体泛型使用。
 */
export type QueryTableConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: QueryTableProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: QueryTableProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryTableSlots<TEntity>
} & QueryTableExpose<TEntity, TId>

export interface GridExposed<TEntity extends BasicIdMetadata<unknown>> {
  fetchDataSource: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}

export type {CollectionPagination}

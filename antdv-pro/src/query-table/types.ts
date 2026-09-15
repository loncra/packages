import type {Component, ComputedRef, EmitsToProps, PublicProps} from 'vue'
import type {TableProps} from 'antdv-next'
import type {ColumnType} from 'antdv-next/dist/table/interface'
import {
  type BasicIdMetadata,
  type DropPosition,
  type FilterRequest,
  type PageRequest,
  type RestResult,
  type ScrollPageResult,
  SYSTEM_CONSTANT,
  type TreeSortMetadata,
} from '@loncra/client/commons'
import type {ActionContext, ActionDefinition, ActionPayload} from '../_util/crud/actions'
import type {CollectionPagination, CollectionService} from '../_util/crud/useCollectionData'

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
  export?: string | boolean
}

export interface QueryCollectionProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  immediate?: boolean
  hideTitle?: boolean
  title?: string
  titleIcon?: string
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  actions?: ActionDefinition<TEntity>[]
  actionContextExtras?: Record<string, unknown>
  drag?: boolean
  formatDragPreview?: (record: TEntity) => string
  prefixCls?: string
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
}

export interface QueryTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryCollectionProps<TBody, TEntity, TPage, TId> {
  bordered?: boolean
  onRow?: TableProps['onRow']
  columns?: SearchableColumnType<TEntity>[]
  rowSelection?: TableProps['rowSelection'] | false
  pagination?: TableProps['pagination']
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
  action: [payload: ActionPayload<TEntity>]
  exported: [result: RestResult<void>]
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
  fetchDataSource: () => Promise<void>
  exportData: (records: TEntity[]) => Promise<void>
  actionContext: ComputedRef<ActionContext<TEntity>>
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
  exportData: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}

export type {CollectionPagination}

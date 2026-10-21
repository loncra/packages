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
    AuthorityProps,
    RecordActionDefinition,
    RecordActionPayload,
    ToolbarActionDefinition,
    ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {CollectionFetch, CollectionService, DefaultCrudEntity,} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {
    BasicCrudQueryClasses,
    BasicCrudQueryExpose,
    BasicCrudQueryStyles,
    EnumBucketRequest,
    PageDictionaries,
    RefreshOnActivate,
} from '../basic-crud-query/types'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'

export interface QueryTableClasses extends BasicCrudQueryClasses {
  table?: TableProps['classes']
}

export interface QueryTableStyles extends BasicCrudQueryStyles {
  table?: TableProps['styles']
}

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

export interface QueryTableProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  columns?: SearchableColumnType<TEntity>[]
  immediate?: boolean
  refreshOnActivate?: RefreshOnActivate
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  recordActions?: RecordActionDefinition<TEntity>[] | false
  enums?: EnumBucketRequest[]
  dictionaryCodes?: (string | undefined)[]
  buckets?: EnumBucketsResponseBody
  dictionaries?: PageDictionaries
  bordered?: boolean
  plain?: boolean
  fetch?: CollectionFetch<TEntity>
  drag?: DragProp<TEntity>
  onRow?: TableProps['onRow']
  rowKey?: TableProps['rowKey']
  rowSelection?: TableProps['rowSelection'] | false
  pagination?: TableProps['pagination']
  prefixCls?: string
  rootClass?: string
  classes?: QueryTableClasses
  styles?: QueryTableStyles
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
  'update:buckets': [value: EnumBucketsResponseBody]
  'update:dictionaries': [value: PageDictionaries]
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

export type QueryTableBodyCellArgs<TEntity extends object = DefaultCrudEntity> = Parameters<
  NonNullable<QueryTableSlots<TEntity>['bodyCell']>
>[0]

export type QueryTableExpandedRowArgs<TEntity extends object = DefaultCrudEntity> = Parameters<
  NonNullable<QueryTableSlots<TEntity>['expandedRowRender']>
>[0]

export interface QueryTableSlots<TEntity extends object> {
  title?: () => unknown
  extra?: () => unknown
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

export type QueryTableConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: QueryTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: QueryTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryTableSlots<TEntity>
} & CollectionExpose<TEntity> &
  Pick<BasicCrudQueryExpose<TEntity, TId>, 'hasRecordActions' | 'needsBulkSelection'>

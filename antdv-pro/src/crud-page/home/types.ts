import type {Component, PublicProps, VNode} from 'vue'
import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {TableProps} from 'antdv-next'
import type {ColumnSearchConfig, QueryTableProps, SearchableColumnType} from '../../query-table/types'
import type {DragProp} from '../../_util/crud/useDrag'
import type {
  CrudPageCore,
  PageCommonDefinition,
  PageDeclContext,
  PageFieldComponent,
  PageLookupFieldSpec,
} from '../types'

export interface PageSearchConfig extends Omit<ColumnSearchConfig, 'component' | 'props'> {
  component: PageFieldComponent | Component
  props?: Record<string, unknown> | ((ctx: PageDeclContext) => Record<string, unknown>)
}

export interface PageTableColumn<TEntity> extends PageLookupFieldSpec {
  key: string
  title?: string
  width?: number
  ellipsis?: boolean
  search?: PageSearchConfig
  render?: (value: unknown, record: TEntity) => unknown
  visible?: (ctx: PageDeclContext) => boolean
}

export type PageTableEntry<TEntity> = (keyof TEntity & string) | PageTableColumn<TEntity>

export interface PageTableDefinition<TEntity extends BasicIdMetadata<unknown>>
  extends PageCommonDefinition<TEntity> {
  columns: PageTableEntry<TEntity>[]
  drag?: DragProp<TEntity>
  rowSelection?: TableProps['rowSelection'] | false
}

export interface CrudTableDefinition<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CrudPageCore<TBody, TEntity, TId> {
  table: PageTableDefinition<TEntity>
}

export interface CrudHomePageProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> {
  page: CrudTableDefinition<TBody, TEntity, TId>
  variant?: string
  extra?: Record<string, unknown>
  title?: VNode | boolean
  query?: QueryTableProps['query']
  plain?: boolean
  fetch?: QueryTableProps['fetch']
}

export interface CrudHomePageExpose<TEntity> {
  fetchDataSource: () => Promise<void | undefined> | undefined
  clearDataSource: () => void
  dataSource: TEntity[]
  buckets: EnumBucketsResponseBody
}

export interface CrudHomePageSlots<TEntity extends object> {
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

export type CrudHomePageConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudHomePageProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudHomePageProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudHomePageSlots<TEntity>
} & CrudHomePageExpose<TEntity>

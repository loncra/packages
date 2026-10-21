import type {PublicProps, VNode} from 'vue'
import type {BasicIdMetadata, SYSTEM_CONSTANT, TreeSortMetadata} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {ActionAppApis} from '../../_util/crud/actions'
import type {
  CardGridDragProp,
  QueryCardGridItemActionsSlot,
  QueryCardGridItemSlot,
  QueryCardGridProps
} from '../../query-card-grid/types'
import type {PageDictionaries} from '../../basic-crud-query/types'
import type {CrudPageCore, PageCommonDefinition} from '../types'

export interface PageCardGridDefinition<TEntity extends BasicIdMetadata<unknown>>
  extends PageCommonDefinition<TEntity> {
  drag?: CardGridDragProp<TEntity>
  onDrop?: (
    payload: {
      sorts: TreeSortMetadata<NonNullable<TEntity[typeof SYSTEM_CONSTANT.ID_NAME]>>[]
      target: TEntity
      fromIndex: number
      toIndex: number
    },
    app: ActionAppApis<TEntity>,
  ) => void | Promise<void>
}

export interface CrudCardGridDefinition<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CrudPageCore<TBody, TEntity, TId> {
  cardGrid: PageCardGridDefinition<TEntity>
}

export interface CrudCardGridPageProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> {
  page: CrudCardGridDefinition<TBody, TEntity, TId>
  variant?: string
  extra?: Record<string, unknown>
  title?: VNode | boolean
  query?: QueryCardGridProps['query']
  plain?: boolean
}

export interface CrudCardGridPageExpose<TEntity> {
  fetchDataSource: () => Promise<void | undefined> | undefined
  clearDataSource: () => void
  dataSource: TEntity[]
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

export interface CrudCardGridPageSlots<TEntity extends object> {
  title?: () => unknown
  extra?: () => unknown
  empty?: () => unknown
  item?: (slot: QueryCardGridItemSlot<TEntity>) => unknown
  itemActions?: (slot: QueryCardGridItemActionsSlot<TEntity>) => unknown
}

export type CrudCardGridPageConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudCardGridPageProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudCardGridPageProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudCardGridPageSlots<TEntity>
} & CrudCardGridPageExpose<TEntity>

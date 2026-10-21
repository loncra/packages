import type {PublicProps, VNode, VNodeChild} from 'vue'
import type {BasicIdMetadata, RestResult, ScrollPageResult, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {CollectionService} from '../_util/crud/useCollectionData'
import type {QueryTableProps, SearchableColumnType} from '../query-table/types'
import type {QueryCardGridItemActionsSlot, QueryCardGridItemSlot, QueryCardGridProps} from '../query-card-grid/types'
import type {PageDictionaries} from '../basic-crud-query/types'
import type {CrudCardGridDefinition, CrudDetailDefinition, CrudFormDefinition, CrudTableDefinition} from './types'

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

export type FormService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = CollectionService<TBody, TEntity, ScrollPageResult<TEntity>, TId> & {
  save: (body: TBody) => Promise<RestResult<TId>>
}

export interface CrudFormPageProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> {
  page: CrudFormDefinition<TBody, TEntity, TId>
  id?: TId
  contextExtra?: Record<string, unknown>
  variant?: string
  buttonAlign?: 'start' | 'center' | 'end'
  title?: VNode | boolean
  plain?: boolean
}

export interface CrudFormPageExpose<TBody> {
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
  entity: TBody
  resetFields: () => void
}

export interface CrudFormPageSlots<TBody extends object> {
  default?: (arg: {
    entity: TBody
    extra: Record<string, unknown>
    buckets: EnumBucketsResponseBody
    dictionaries: PageDictionaries
  }) => unknown
  buttons?: (arg: {
    entity: TBody
    extra: Record<string, unknown>
    loading: boolean
    submitButton: () => VNodeChild
    resetButton: () => VNodeChild
  }) => unknown
}

export type CrudFormPageConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudFormPageProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudFormPageProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudFormPageSlots<TBody>
} & CrudFormPageExpose<TBody>

export interface CrudFormModalProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> extends Omit<CrudFormPageProps<TId, TBody, TEntity>, 'title'> {
  open?: boolean
  title?: VNodeChild
  width?: string | number
}

export type CrudFormModalSlots<TBody extends object> = CrudFormPageSlots<TBody>

export type CrudFormModalExpose<TBody> = CrudFormPageExpose<TBody>

export type CrudFormModalConstructor = new <
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
>(
  props: CrudFormModalProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudFormModalProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudFormModalSlots<TBody>
} & CrudFormModalExpose<TBody>

export interface CrudDetailPageProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> {
  page: CrudDetailDefinition<TBody, TEntity, TId>
  id?: TId
  contextExtra?: Record<string, unknown>
  variant?: string
}

export interface CrudDetailPageExpose<TEntity> {
  entity: TEntity
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

export interface CrudDetailPageSlots<TEntity extends object> {
  extra?: () => unknown
  afterDescriptions?: (arg: {
    entity: TEntity
    extra: Record<string, unknown>
    buckets: EnumBucketsResponseBody
    dictionaries: PageDictionaries
  }) => unknown
  afterOperationDataTrace?: () => unknown
}

export type CrudDetailPageConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudDetailPageProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudDetailPageProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudDetailPageSlots<TEntity>
} & CrudDetailPageExpose<TEntity>

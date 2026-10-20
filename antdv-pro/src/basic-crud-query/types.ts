import type {EmitsToProps, PublicProps, VNode, VNodeChild} from 'vue'
import type {TableProps} from 'antdv-next'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
  BasicIdMetadata,
  FilterRequest,
  PageRequest,
  ScrollPageResult,
} from '@loncra/client/commons'
import type {
  AuthorityProps,
  RecordActionDefinition,
  RecordActionPayload,
  ResolvedAction,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {CollectionFetch, CollectionService} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {DataDictionaryMetadata, EnumBucketsResponseBody} from '@loncra/client/resource'

export interface EnumRef {
  module: string
  id: string
}

export interface EnumBucketRequest {
  module: string
  ids: string[]
}

export type PageDictionaries = Record<string, DataDictionaryMetadata[]>

export type BasicCrudQuerySelectedKey = 'selectedRows' | 'selectedItems'

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
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  drag?: DragProp<TEntity>
  prefixCls?: string
  plain?: boolean
  fetch?: CollectionFetch<TEntity>
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  rowKey?: TableProps['rowKey']
}

export interface BasicCrudQueryProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends QueryCollectionProps<TBody, TEntity, TPage, TId> {
  title?: VNode | boolean
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  selectedKey?: BasicCrudQuerySelectedKey
  pagination?: TableProps['pagination']
  selectedRows?: TEntity[]
  selectedItems?: TEntity[]
  recordActions?: RecordActionDefinition<TEntity>[] | false
  enums?: EnumBucketRequest[]
  dictionaryCodes?: (string | undefined)[]
  buckets?: EnumBucketsResponseBody
  dictionaries?: PageDictionaries
}

export type BasicCrudQueryEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = {
  'update:dataSource': [value: TEntity[]]
  'update:loading': [value: boolean]
  'update:query': [value: FilterRequest | PageRequest]
  'update:selectedRows': [value: TEntity[]]
  'update:selectedItems': [value: TEntity[]]
  'update:pagination': [value: TableProps['pagination']]
  'update:buckets': [value: EnumBucketsResponseBody]
  'update:dictionaries': [value: PageDictionaries]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
}

export interface BasicCrudQueryContentProps {
  title?: VNodeChild
  extra?: VNodeChild
}

export interface BasicCrudQuerySlots {
  default?: (props: BasicCrudQueryContentProps) => VNodeChild
  title?: () => VNodeChild
  extra?: () => VNodeChild
}

export interface BasicCrudQueryExpose<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CollectionExpose<TEntity> {
  resolveRecordActions: (record: TEntity) => ResolvedAction[]
  onRecordAction: (id: string, record: TEntity) => void
  hasRecordActions: boolean
  needsBulkSelection: boolean
}

export type BasicCrudQueryConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: BasicCrudQueryProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: BasicCrudQueryProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps
  $slots: BasicCrudQuerySlots
} & BasicCrudQueryExpose<TEntity, TId>

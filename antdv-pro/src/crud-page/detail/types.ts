import type {PublicProps} from 'vue'
import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {EnumBucketRequest, PageDictionaries} from '../../basic-crud-query/types'
import type {CrudPageCore, PageDeclContext, PageFieldSpec} from '../types'

export interface PageDetailItem<TEntity> extends PageFieldSpec {
  key: string
  span?: number | 'filled'
  render?: (value: unknown, record: TEntity) => unknown
}

export type PageDetailEntry<TEntity> = (keyof TEntity & string) | PageDetailItem<TEntity>

export interface PageDetailDefinition<TEntity, TId = string | number> {
  fields: PageDetailEntry<TEntity>[]
  enums?: EnumBucketRequest[]
  dictionaryCodes?: string[]
  createEntity?: () => TEntity
  column?: Record<string, number>
  postGetEntity?: (entity: TEntity, ctx: PageDeclContext) => TEntity | Promise<TEntity>
  getDetail?: (id: TId, ctx: PageDeclContext) => Promise<TEntity | undefined>
}

export interface CrudDetailDefinition<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CrudPageCore<TBody, TEntity, TId> {
  detail: PageDetailDefinition<TEntity, TId>
}

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

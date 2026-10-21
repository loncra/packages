import type {Component, PublicProps, Ref, VNode, VNodeChild} from 'vue'
import type {BasicIdMetadata, RestResult, ScrollPageResult, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {ColProps, FormItemProps} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {CollectionService} from '../../_util/crud/useCollectionData'
import type {EnumBucketRequest, PageDictionaries} from '../../basic-crud-query/types'
import type {CrudPageCore, PageDeclContext, PageFieldComponent, PageLookupFieldSpec} from '../types'

export interface PageFieldRenderContext<TBody> {
  entity: TBody
  t: (key: string, named?: Record<string, unknown>) => string
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
  variant?: string
  extra: Record<string, unknown>
}

export type PageFormFieldKey<TBody> = keyof TBody & string | `${keyof TBody & string}.${string}`

export type PageFormFieldSlots = Record<string, (...args: never[]) => VNodeChild>

export interface PageFormField<TBody> extends PageLookupFieldSpec {
  key: PageFormFieldKey<TBody>
  component?: PageFieldComponent | Component
  label?: false
  rules?: FormItemProps['rules'] | ((ctx: PageFieldRenderContext<TBody>) => FormItemProps['rules'])
  col?: ColProps
  props?:
    | Record<string, unknown>
    | ((ctx: PageFieldRenderContext<TBody>) => Record<string, unknown>)
  slots?: PageFormFieldSlots
  render?: (ctx: PageFieldRenderContext<TBody>) => unknown
  visible?: (ctx: PageDeclContext) => boolean
}

export interface PageFormContext<TBody> extends PageDeclContext {
  entity: Ref<TBody>
  t: (key: string, named?: Record<string, unknown>) => string
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

export interface PageFormDefinition<TBody, TEntity> {
  fields: PageFormField<TBody>[]
  enums?: EnumBucketRequest[]
  dictionaryCodes?: string[]
  createEntity: () => TBody
  preMounted?: (ctx: PageFormContext<TBody>) => void | Promise<void>
  postMounted?: () => void | Promise<void>
  preSubmit?: (ctx: PageFormContext<TBody>) => void | Promise<void>
  submit?: (entity: TBody, ctx: PageFormContext<TBody>) => Promise<RestResult<unknown>>
  postSubmit?: (
    result: unknown,
    ctx: PageFormContext<TBody>,
  ) => boolean | void | Promise<boolean | void>
  postGetEntity?: (entity: TEntity, ctx: PageFormContext<TBody>) => TEntity | Promise<TEntity>
  onReset?: (ctx: PageFormContext<TBody>) => void
}

export type CrudFormCore<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = Omit<CrudPageCore<TBody, TEntity, TId>, 'service'> & {
  service?: CollectionService<TBody, TEntity, ScrollPageResult<TEntity>, TId>
}

export interface CrudFormDefinition<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CrudFormCore<TBody, TEntity, TId> {
  form: PageFormDefinition<TBody, TEntity>
}

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

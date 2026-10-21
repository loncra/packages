import type {Component, VNode} from 'vue'
import type {BasicIdMetadata, NameValueEnumMetadata, ScrollPageResult, SYSTEM_CONSTANT,} from '@loncra/client/commons'
import type {AuthorityProps, RecordActionDefinition, ToolbarActionDefinition,} from '../_util/crud/actions'
import type {CollectionService} from '../_util/crud/useCollectionData'
import type {CrudNavigateTarget} from '../_util/crud/navigate'
import type {StaleCheckMode} from '../_util/crud/useStaleCheck'
import type {EnumBucketRequest, EnumRef, PageDictionaries} from '../basic-crud-query/types'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'

export type {CrudStaleInfo} from '../_util/crud/useStaleCheck'

export interface CrudPageRoutes {
  home?: string
  add?: string
  edit?: string
  detail?: string
}

export interface CrudPageCore<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, ScrollPageResult<TEntity>, TId>
  rowKey?: keyof TEntity & string
  i18nPrefix: string
  routes?: CrudPageRoutes
  operationDataTraceTarget?: string
  staleCheck?: StaleCheckMode
  fields?: PageFieldsDictionary<TEntity>
  i18nResolver?: (key: string, named?: Record<string, unknown>) => string
  onNavigate?: (target: CrudNavigateTarget<TEntity>) => void
}

type BuiltinKey<T extends string> = T | (string & {})

export type PageValueFormat = BuiltinKey<
  'enum' | 'enumList' | 'dict' | 'dictList' | 'date' | 'dateTime' | 'byte'
>

export interface PageValueFormatSpec {
  name: PageValueFormat
  args?: unknown
}

export type PageFieldComponent = BuiltinKey<
  'input' | 'password' | 'textarea' | 'number' | 'select' | 'date' | 'dateRange'
>

export interface PageFieldSpec {
  labelKey?: string
  format?: PageValueFormat | PageValueFormatSpec
}

export interface PageLookupFieldSpec extends PageFieldSpec {
  enumRef?: EnumRef
  dictId?: string
}

export type PageFieldsDictionary<TEntity> = Partial<
  Record<keyof TEntity & string, PageLookupFieldSpec>
>

export interface PageDeclContext {
  variant?: string
  extra: Record<string, unknown>
}

export interface PageCommonDefinition<TEntity extends BasicIdMetadata<unknown>> {
  authority?: AuthorityProps
  enums?: EnumBucketRequest[]
  dictionaryCodes?: string[]
  recordActions?:
    | RecordActionDefinition<TEntity>[]
    | false
    | ((ctx: PageDeclContext) => RecordActionDefinition<TEntity>[] | false)
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
}

export interface FieldComponentSpec {
  component: Component
  defaults?: Record<string, unknown>
  mapOptions?: (options: NameValueEnumMetadata<number | string>[]) => Record<string, unknown>
  ownFormItem?: boolean
  beforeSubmit?: (expose: unknown) => void | Promise<void>
}

export interface FormatContext {
  key: string
  record: unknown
  enumRef?: EnumRef
  dictId?: string
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
}

export type ValueFormatter = (
  value: unknown,
  ctx: FormatContext,
  args?: unknown,
) => string | VNode

export interface PageRegistry {
  fieldComponents: Record<string, FieldComponentSpec>
  formatters: Record<string, ValueFormatter>
}

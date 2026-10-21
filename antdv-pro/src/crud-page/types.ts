import type {Component, Ref, VNode, VNodeChild} from 'vue'
import type {ColProps, FormItemProps, TableProps} from 'antdv-next'
import type {
  BasicIdMetadata,
  NameValueEnumMetadata,
  RestResult,
  ScrollPageResult,
  SYSTEM_CONSTANT,
  TreeSortMetadata,
} from '@loncra/client/commons'
import type {
  ActionAppApis,
  AuthorityProps,
  RecordActionDefinition,
  ToolbarActionDefinition,
} from '../_util/crud/actions'
import type {CollectionService} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {CrudNavigateTarget} from '../_util/crud/navigate'
import type {StaleCheckMode} from '../_util/crud/useStaleCheck'
import type {ColumnSearchConfig} from '../query-table/types'
import type {CardGridDragProp} from '../query-card-grid/types'
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

export interface PageFieldRenderContext<TBody> {
  entity: TBody
  t: (key: string, named?: Record<string, unknown>) => string
  buckets: EnumBucketsResponseBody
  dictionaries: PageDictionaries
  variant?: string
  extra: Record<string, unknown>
}

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

export type * from './pageTypes'

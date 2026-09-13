import {SYSTEM_CONSTANT} from '../constants/system.ts'
import {TIME_UNIT_TYPE} from '../enumerate.ts'

export interface RestResult<T = unknown> {
  data?: T
  executeCode: string
  status: number
  timestamp: number
  metadata?: Record<string, unknown>
  message: string
}

export interface BasicIdMetadata<T> {
  id?: T
}

export interface StringIdEntity extends BasicIdMetadata<string> {
  creationTime?: number
}

export interface VersionEntityMetadata extends BasicIdMetadata<number> {
  creationTime?: number
  version?: number
}

export interface IdNameMetadata extends BasicIdMetadata<string> {
  name: string
  [key: string]: unknown
}

export interface IdNameValueMetadata<T> extends IdNameMetadata {
  value: T
}

export interface IdValueMetadata<I, V> extends BasicIdMetadata<I> {
  value: V
  metadata?: Record<string, unknown>
}

export interface NameEnumMetadata {
  name: string
  [key: string]: unknown
}

export interface NameValueEnumMetadata<T> extends NameEnumMetadata {
  value: T
}

export class BusinessError extends Error {
  constructor(
    public executeCode: string,
    public status: number,
    public message: string,
    public data?: unknown,
  ) {
    super(message)
    this.name = 'BusinessError'
    Object.setPrototypeOf(this, BusinessError.prototype)
  }
}

export interface RunCommandData {
  stdout: string
  stderr: string
  code: number
}

export interface ServerSentEvent<T> {
  id: string
  event: string
  retry?: number
  comment?: string
  data?: T | string
}

export interface FilterRequest {
  sort?: IdNameMetadata[]
  [key: string]: unknown
}

export interface PageRequest extends FilterRequest {
  number: number
  size?: number
}

export interface ScrollPageResult<T> {
  elements: T[]
  metadata?: Record<string, unknown>
  numberOfElements?: number
  size: number
  last: boolean
}

export interface PageResult<T> extends ScrollPageResult<T> {
  number: number
  first: boolean
}

export interface TotalPage<T> extends PageResult<T> {
  totalCount: number
  totalPages: number
}

export interface DetailSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  get(id: TId): Promise<RestResult<TEntity>>
  exportData(filter: FilterRequest): Promise<RestResult<void>>
}

export interface FindSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchService<TEntity, TId> {
  find(request: FilterRequest): Promise<RestResult<TEntity[]>>
}

export interface PageSearchService<
  TEntity extends BasicIdMetadata<TId>,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchService<TEntity, TId> {
  page(request: PageRequest): Promise<RestResult<TPage>>
}

export interface BasicCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchService<TEntity, TId> {
  save(entity: TBody): Promise<RestResult<TId>>
  delete(ids: TId[]): Promise<RestResult<void>>
}

export interface PageCurdService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicCrudService<TBody, TEntity, TId>, PageSearchService<TEntity, TPage, TId> {}

export interface FindCurdService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicCrudService<TBody, TEntity, TId>, FindSearchService<TEntity, TId> {}

export type TimeUnitType =
  | typeof TIME_UNIT_TYPE.HOURS
  | typeof TIME_UNIT_TYPE.MINUTES
  | typeof TIME_UNIT_TYPE.DAYS
  | typeof TIME_UNIT_TYPE.SECONDS
  | typeof TIME_UNIT_TYPE.MILLISECONDS
  | typeof TIME_UNIT_TYPE.MICROSECONDS
  | typeof TIME_UNIT_TYPE.NANOSECONDS

export interface TimeProperties {
  value: number
  unit: TimeUnitType | string
}

export interface FlatSortMetadata<T> extends BasicIdMetadata<T> {
  sort: number
}

export interface TreeSortMetadata<T> extends FlatSortMetadata<T> {
  parentId?: T
}

export interface AuditMetadata {
  status: NameValueEnumMetadata<number> | number
  remark?: string
}

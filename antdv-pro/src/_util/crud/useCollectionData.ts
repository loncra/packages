import type {Ref} from 'vue'
import {
    type BasicCrudService,
    type BasicIdMetadata,
    type FilterRequest,
    type FindSearchService,
    type PageRequest,
    type PageResult,
    type PageSearchService,
    type RestResult,
    type ScrollPageResult,
    SYSTEM_CONSTANT,
    type TotalPage,
} from '@loncra/client/commons'

export interface CollectionPageState {
  current?: number
  pageSize?: number
  total?: number
}

export type CollectionPagination = false | CollectionPageState

/** 未指定业务实体时的回退：只保证有 id，对标 commons `BasicIdMetadata` */
export type DefaultCrudEntity = BasicIdMetadata<string | number>

/** 统一默认分页：表格 / 卡片 / 基类三处 `pagination` 的默认值（单页隐藏 + 居中） */
export const DEFAULT_COLLECTION_PAGINATION = {hideOnSinglePage: true, align: 'center'} as const

/** 改查询条件：把 patch 并进持有查询状态的 ref（表格 / 基类共用同一个动作） */
export function patchQuery(query: Ref<FilterRequest | PageRequest>, patch: FilterRequest): void {
  query.value = {...query.value, ...patch}
}

export type CollectionService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> =
  | FindSearchService<TEntity, TId>
  | PageSearchService<TEntity, TPage, TId>
  | BasicCrudService<TBody, TEntity, TId>

export function syncPaginationFromPageResult<TEntity>(
  pagination: CollectionPageState,
  pageData: ScrollPageResult<TEntity> & Partial<PageResult<TEntity>> & Partial<TotalPage<TEntity>>,
  fallbackNumber: number,
  rowCount: number,
) {
  pagination.pageSize = pageData.size || 10
  const n =
    typeof pageData.number === 'number' && Number.isFinite(pageData.number)
      ? pageData.number
      : fallbackNumber
  if (pageData.number) {
    pagination.current = pageData.number
    if (pageData.last) {
      pagination.total = (n - 1) * pageData.size + rowCount
    } else {
      pagination.total = n * pageData.size + 1
    }
  }
  if (pageData.totalCount) {
    pagination.total = pageData.totalCount
  }
}

export function syncPaginationFromFindResult(
  pagination: CollectionPageState,
  query: FilterRequest | PageRequest,
  rowCount: number,
) {
  const querySize = typeof query.size === 'number' ? query.size : undefined
  const pageSize = pagination.pageSize ?? querySize ?? 10
  const queryNumber = typeof query.number === 'number' ? query.number : undefined
  const current = pagination.current ?? queryNumber ?? 1
  pagination.pageSize = pageSize
  pagination.current = current
  if (rowCount < pageSize) {
    pagination.total = (current - 1) * pageSize + rowCount
  } else {
    pagination.total = current * pageSize + 1
  }
}

function isPageSearchService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId,
>(service: CollectionService<TBody, TEntity, TPage, TId>): service is PageSearchService<TEntity, TPage, TId> {
  return 'page' in service && typeof service.page === 'function'
}

function isFindSearchService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId,
>(service: CollectionService<TBody, TEntity, TPage, TId>): service is FindSearchService<TEntity, TId> {
  return 'find' in service && typeof service.find === 'function'
}

export async function fetchCollectionData<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(options: {
  service: CollectionService<TBody, TEntity, TPage, TId>
  query: FilterRequest | PageRequest
  pagination: Ref<CollectionPagination | undefined>
}): Promise<TEntity[]> {
  const {service, query, pagination} = options
  const data: TEntity[] = []

  if (isPageSearchService(service)) {
    const number = typeof query.number === 'number' ? query.number : 1
    const result: RestResult<TPage> = await service.page({...query, number})
    data.push(...(result.data?.elements || []))
    if (result.data && pagination.value !== false && pagination.value != null) {
      syncPaginationFromPageResult(pagination.value, result.data, number, data.length)
    }
  } else if (isFindSearchService(service)) {
    const result: RestResult<TEntity[]> = await service.find(query)
    data.push(...(result.data || []))
    if (pagination.value === undefined) {
      pagination.value = false
    } else if (pagination.value !== false) {
      syncPaginationFromFindResult(pagination.value, query, data.length)
    }
  }

  return data
}

export async function exportCollectionData<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(options: {
  service: CollectionService<TBody, TEntity, TPage, TId>
  query: FilterRequest | PageRequest
  records: TEntity[]
}): Promise<RestResult<void>> {
  if (options.records.length > 0) {
    const filter: FilterRequest = {}
    filter[`filter_[${SYSTEM_CONSTANT.ID_NAME}_in]`] = options.records.map(
      (record) => record[SYSTEM_CONSTANT.ID_NAME],
    )
    return options.service.exportData(filter)
  }
  return options.service.exportData(options.query)
}

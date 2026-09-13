import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, DetailSearchService, FilterRequest, RestResult,} from '../domain/common.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class DetailSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> implements DetailSearchService<TEntity, TId> {
  static readonly EXPORT_URL = '/export'

  constructor(protected readonly baseUrl: string) {}

  exportData(filter: FilterRequest): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl + DetailSearchRestfulService.EXPORT_URL,
      method: 'POST',
      data: formUrlEncoded(filter as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  get(id: TId): Promise<RestResult<TEntity>> {
    return http().request({
      url: `${this.baseUrl}/${id}`,
      method: 'GET',
    })
  }
}

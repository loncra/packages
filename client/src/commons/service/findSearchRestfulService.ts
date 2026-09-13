import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, FilterRequest, FindSearchService, RestResult,} from '../domain/common.ts'
import {DetailSearchRestfulService} from './detailSearchRestfulService.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class FindSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<TEntity, TId>
  implements FindSearchService<TEntity, TId>
{
  static readonly FIND_URL = '/find'

  find(request: FilterRequest): Promise<RestResult<TEntity[]>> {
    return http().request({
      url: this.baseUrl + FindSearchRestfulService.FIND_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

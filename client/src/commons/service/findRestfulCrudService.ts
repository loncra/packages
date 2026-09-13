import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, FilterRequest, FindCurdService, RestResult,} from '../domain/common.ts'
import {BasicRestfulCrudService} from './basicRestfulCrudService.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class FindRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicRestfulCrudService<TBody, TEntity, TId>
  implements FindCurdService<TBody, TEntity, TId>
{
  static readonly FIND_URL = '/find'

  find(request: FilterRequest): Promise<RestResult<TEntity[]>> {
    return http().request({
      url: this.baseUrl + FindRestfulCrudService.FIND_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicCrudService, BasicIdMetadata, RestResult} from '../domain/common.ts'
import {DetailSearchRestfulService} from './detailSearchRestfulService.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class BasicRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<TEntity, TId>
  implements BasicCrudService<TBody, TEntity, TId>
{
  save(entity: TBody): Promise<RestResult<TId>> {
    return http().request({
      url: this.baseUrl,
      method: 'PUT',
      data: entity,
      bodyType: 'json',
    })
  }

  delete(ids: TId[]): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }
}

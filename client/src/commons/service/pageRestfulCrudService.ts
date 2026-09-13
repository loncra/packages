import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, PageCurdService, PageRequest, RestResult, ScrollPageResult,} from '../domain/common.ts'
import {BasicRestfulCrudService} from './basicRestfulCrudService.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class PageRestfulCrudService<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends BasicRestfulCrudService<TBody, TEntity, TId>
  implements PageCurdService<TBody, TEntity, TPage, TId>
{
  static readonly PAGE_URL = '/page'

  page(request: PageRequest): Promise<RestResult<TPage>> {
    return http().request({
      url: this.baseUrl + PageRestfulCrudService.PAGE_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

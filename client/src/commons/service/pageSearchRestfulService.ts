import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, PageRequest, PageSearchService, RestResult, ScrollPageResult,} from '../domain/common.ts'
import {DetailSearchRestfulService} from './detailSearchRestfulService.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

export class PageSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends DetailSearchRestfulService<TEntity, TId>
  implements PageSearchService<TEntity, TPage, TId>
{
  static readonly PAGE_URL = '/page'

  page(request: PageRequest): Promise<RestResult<TPage>> {
    return http().request({
      url: this.baseUrl + PageSearchRestfulService.PAGE_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

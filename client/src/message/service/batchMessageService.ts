import {
    formUrlEncoded,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {BatchMessageEntity} from '../domain/batch.ts'

export class BatchMessageService extends PageSearchRestfulService<
  BatchMessageEntity,
  TotalPage<BatchMessageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return BatchMessageService.BASE_URL + '/batch'
  }

  constructor() {
    super(BatchMessageService.SERVICE_URL)
  }

  delete(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }
}

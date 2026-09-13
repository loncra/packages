import {
    formUrlEncoded,
    type PageRequest,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {BatchResponse} from '../domain/message.ts'
import type {SiteMessageEntity, SiteMessageSendPayload} from '../domain/site.ts'

export class SiteMessageService extends PageSearchRestfulService<
  SiteMessageEntity,
  TotalPage<SiteMessageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return SiteMessageService.BASE_URL + '/site'
  }

  static get COUNT_READ_URL(): string {
    return SiteMessageService.SERVICE_URL + '/read/count'
  }

  static get READ_ALL_URL(): string {
    return SiteMessageService.SERVICE_URL + '/read/all'
  }

  static get DELETE_READ_URL(): string {
    return SiteMessageService.SERVICE_URL + '/read/delete'
  }

  static get READ_URL(): string {
    return SiteMessageService.SERVICE_URL + '/read'
  }

  static get MY_URL(): string {
    return SiteMessageService.SERVICE_URL + '/my'
  }

  constructor() {
    super(SiteMessageService.SERVICE_URL)
  }

  delete(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  send(data: SiteMessageSendPayload): Promise<RestResult<number[] | BatchResponse>> {
    return http().request({
      url: SiteMessageService.SERVICE_URL,
      method: 'PUT',
      data,
      bodyType: 'json',
    })
  }

  countRead(batchId: number): Promise<RestResult<number>> {
    return http().request({
      url: SiteMessageService.COUNT_READ_URL + '/' + batchId,
      method: 'GET',
    })
  }

  readAll(...types: string[]): Promise<RestResult<void>> {
    return http().request({
      url: SiteMessageService.READ_ALL_URL,
      method: 'POST',
      data: formUrlEncoded({types}),
      bodyType: 'form',
    })
  }

  deleteRead(...types: string[]): Promise<RestResult<void>> {
    return http().request({
      url: SiteMessageService.DELETE_READ_URL,
      method: 'DELETE',
      params: formUrlEncoded({types}),
    })
  }

  read(id: number): Promise<RestResult<SiteMessageEntity>> {
    return http().request({
      url: SiteMessageService.READ_URL + '/' + id,
      method: 'GET',
    })
  }

  my(request: PageRequest): Promise<RestResult<TotalPage<SiteMessageEntity>>> {
    return http().request({
      url: SiteMessageService.MY_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

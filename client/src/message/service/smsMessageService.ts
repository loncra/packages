import {
    formUrlEncoded,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {BatchResponse} from '../domain/message.ts'
import type {SmsMessageEntity, SmsMessageSendPayload} from '../domain/sms.ts'

export class SmsMessageService extends PageSearchRestfulService<
  SmsMessageEntity,
  TotalPage<SmsMessageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return SmsMessageService.BASE_URL + '/sms'
  }

  constructor() {
    super(SmsMessageService.SERVICE_URL)
  }

  delete(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  send(data: SmsMessageSendPayload): Promise<RestResult<number[] | BatchResponse>> {
    return http().request({
      url: SmsMessageService.SERVICE_URL,
      method: 'PUT',
      data,
      bodyType: 'json',
    })
  }
}

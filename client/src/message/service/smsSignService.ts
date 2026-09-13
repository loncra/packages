import {
    type FilterRequest,
    formUrlEncoded,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {SmsSignEntity, SmsTemplateEntity} from '../domain/sms.ts'

export class SmsSignService extends PageSearchRestfulService<
  SmsSignEntity,
  TotalPage<SmsSignEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return SmsSignService.BASE_URL + '/sms/sign'
  }

  static readonly FIND_URL = '/find'

  constructor(channel: string) {
    super(SmsSignService.SERVICE_URL + '/' + channel)
  }

  find(filter: FilterRequest = {}): Promise<RestResult<SmsTemplateEntity[]>> {
    return http().request({
      url: this.baseUrl + SmsSignService.FIND_URL,
      method: 'POST',
      data: formUrlEncoded(filter as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

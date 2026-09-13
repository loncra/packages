import {
    type FilterRequest,
    formUrlEncoded,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {SmsTemplateEntity} from '../domain/sms.ts'

export class SmsTemplateService extends PageSearchRestfulService<
  SmsTemplateEntity,
  TotalPage<SmsTemplateEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return SmsTemplateService.BASE_URL + '/sms/template'
  }

  static readonly FIND_URL = '/find'

  constructor(channel: string) {
    super(SmsTemplateService.SERVICE_URL + '/' + channel)
  }

  find(filter: FilterRequest = {}): Promise<RestResult<SmsTemplateEntity[]>> {
    return http().request({
      url: this.baseUrl + SmsTemplateService.FIND_URL,
      method: 'POST',
      data: formUrlEncoded(filter as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  getByCode(code: string): Promise<RestResult<Record<string, unknown>>> {
    return http().request({
      url: this.baseUrl + '/' + code,
      method: 'GET',
    })
  }
}

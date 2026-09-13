import {
    formUrlEncoded,
    PageSearchRestfulService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {EmailMessageEntity, EmailMessageSendPayload} from '../domain/email.ts'
import type {BatchResponse} from '../domain/message.ts'

export class EmailMessageService extends PageSearchRestfulService<
  EmailMessageEntity,
  TotalPage<EmailMessageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return EmailMessageService.BASE_URL + '/email'
  }

  constructor() {
    super(EmailMessageService.SERVICE_URL)
  }

  delete(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: this.baseUrl,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  send(data: EmailMessageSendPayload): Promise<RestResult<number[] | BatchResponse>> {
    return http().request({
      url: EmailMessageService.SERVICE_URL,
      method: 'PUT',
      data,
      bodyType: 'json',
    })
  }
}

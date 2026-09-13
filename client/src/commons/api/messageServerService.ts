import {SYSTEM_MODULE_NAME} from '../constants/system.ts'
import type {IdNameMetadata, RestResult} from '../domain/common.ts'
import type {MessageGroup} from '../domain/message.ts'
import {http, modulePrefix} from '../../http'

export class MessageServerService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get UNREAD_QUANTITY_URL(): string {
    return MessageServerService.BASE_URL + '/unreadQuantity'
  }

  static get TYPE_URL(): string {
    return MessageServerService.BASE_URL + '/types'
  }

  static unreadQuantity(): Promise<RestResult<Record<MessageGroup, Record<number, number>>>> {
    return http().request({
      url: MessageServerService.UNREAD_QUANTITY_URL,
      method: 'GET',
    })
  }

  static types(category: MessageGroup): Promise<RestResult<IdNameMetadata[]>> {
    return http().request({
      url: MessageServerService.TYPE_URL + '/' + category,
      method: 'GET',
    })
  }
}

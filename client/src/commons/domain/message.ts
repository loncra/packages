import type {NameValueEnumMetadata} from './common.ts'
import type {MESSAGE_SERVER_MESSAGE_GROUP} from '../../message/enumerate.ts'

export type MessageGroup =
  | typeof MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT
  | typeof MESSAGE_SERVER_MESSAGE_GROUP.SITE
  | typeof MESSAGE_SERVER_MESSAGE_GROUP.DEFAULT
  | typeof MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL

export type UserChatUnreadItem = {
  count: number
  muted: NameValueEnumMetadata<number> | number
}

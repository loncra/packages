import type {NameValueEnumMetadata} from './common.ts'
import type {MESSAGE_GROUP} from '../enumerate.ts'

export type MessageGroup =
  | typeof MESSAGE_GROUP.USER_CHAT
  | typeof MESSAGE_GROUP.SITE
  | typeof MESSAGE_GROUP.DEFAULT
  | typeof MESSAGE_GROUP.USER_CHAT_CALL

export type UserChatUnreadItem = {
  count: number
  muted: NameValueEnumMetadata<number> | number
}

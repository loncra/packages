import type {
  FileObject,
  IdValueMetadata,
  NameValueEnumMetadata,
  PlatformUser,
  VersionEntityMetadata,
} from '../../commons'
import type {CHAT_CALL_TYPE} from '../enumerate/chat.ts'

export interface UserChatRoomEntity extends VersionEntityMetadata {
  businessId?: string
  businessScene?: string
  type?: NameValueEnumMetadata<number> | number
  metadata?: Record<string, unknown>
}

export interface UserChatMessageEntity extends VersionEntityMetadata {
  userChatRoomId: number
  principal: string
  undo: NameValueEnumMetadata<number> | number
  undoableTime: number
  undoTime: number
  metadata: Record<string, unknown>
  type: NameValueEnumMetadata<number> | number
  /** HTTP JSON；管理端收窄为聊天气泡块 */
  content: any
}

export interface UserChatParticipantDetails {
  details: PlatformUser
}

export interface UserChatParticipantMetadata {
  type: NameValueEnumMetadata<number> | number
  metadata: UserChatParticipantDetails
}

export interface UserChatParticipantEntity
  extends VersionEntityMetadata, UserChatParticipantMetadata {
  principal: string
}

export interface ParticipantMetadataMessageResponseBody extends UserChatMessageEntity {
  participant: UserChatParticipantMetadata
}

export interface UserChatMessageResponseBody extends ParticipantMetadataMessageResponseBody {
  readableCount: number
  readCount: number
  readable: NameValueEnumMetadata<number> | number
}

export interface MessageContentMentionMetadata {
  messageId: number
  creationTime: number
  participant: UserChatParticipantMetadata
}

export interface BasicUserChatConversation extends VersionEntityMetadata {
  principal: string
  name: string
  cover: FileObject[]
  pinned: NameValueEnumMetadata<number> | number
  pinnedTime: number
  status: NameValueEnumMetadata<number> | number
  muted: NameValueEnumMetadata<number> | number
  mentions?: MessageContentMentionMetadata[]
}

export interface UserChatConversationEntity extends BasicUserChatConversation {
  userChatRoomId: number
  lastUserChatMessageId: number
}

export interface UserChatConversationResponseBody extends BasicUserChatConversation {
  lastUserMessage: UserChatMessageEntity
  room: UserChatRoomEntity
  readableCount: number
  /** HTTP / 本地草稿；管理端收窄为 Sender 词槽 */
  draft?: any[]
}

export interface UserChatMessageReadEntity extends VersionEntityMetadata {
  userChatMessageId: number
  principal: string
  readable: NameValueEnumMetadata<number> | number
  readTime: number
}

export interface UserChatMessageReadResponseBody extends UserChatMessageReadEntity {
  participant: UserChatParticipantMetadata
}

export type ChatCallType = typeof CHAT_CALL_TYPE.VIDEO | typeof CHAT_CALL_TYPE.VOICE

export interface UserChatCallEntity extends VersionEntityMetadata {
  userChatRoomId: number
  type: NameValueEnumMetadata<number> | number
  metadata: Record<string, unknown>
  startTime: number
  endTime: number
  status: NameValueEnumMetadata<number> | number
  scene: NameValueEnumMetadata<number> | number
  name: string
}

export interface UserChatCallParticipantMetadata extends UserChatParticipantDetails {
  liveKit: IdValueMetadata<string, string>
}

export interface UserChatCallParticipantEntity
  extends VersionEntityMetadata, UserChatParticipantMetadata {
  userChatCallId: number
  status: NameValueEnumMetadata<number> | number
  joinTime: number
  leaveTime: number
  reconnectTime: number
  principal: string
  metadata: UserChatCallParticipantMetadata
}

export interface UserChatCallResponseBody extends UserChatCallEntity {
  room: UserChatRoomEntity
  participants: UserChatCallParticipantEntity[]
}

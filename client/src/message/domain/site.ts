import type {NameValueEnumMetadata, ObjectWriteResult} from '../../commons'
import type {BasicMessageEntity} from './message.ts'

export interface BasicSiteMessage {
  type: NameValueEnumMetadata<number> | number
  title: string
  content: string
  pushable: NameValueEnumMetadata<number> | number
  attachmentList: ObjectWriteResult[]
  metadata?: Record<string, unknown>
  cover?: ObjectWriteResult
  channels: NameValueEnumMetadata<number>[] | number[]
  remark: string
}

export interface SiteMessageEntity extends BasicMessageEntity, BasicSiteMessage {
  toUser: string
  readable: NameValueEnumMetadata<number> | number
  readTime: number
  batchId: number
}

export interface SiteMessageSendPayload extends BasicSiteMessage {
  toUsers: string[]
}

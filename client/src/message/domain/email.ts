import type {NameValueEnumMetadata, ObjectWriteResult} from '../../commons'
import type {BasicMessageEntity} from './message.ts'

export interface BasicEmailMessage {
  type: NameValueEnumMetadata<number> | number
  title: string
  content: string
  channel?: NameValueEnumMetadata<string> | string
  attachmentList: ObjectWriteResult[]
  metadata?: Record<string, unknown>
  remark: string
}

export interface EmailMessageEntity extends BasicMessageEntity, BasicEmailMessage {
  toEmail: string
  batchId: number
  fromEmail: string
}

export interface EmailMessageSendPayload extends BasicEmailMessage {
  toEmails: string[]
}

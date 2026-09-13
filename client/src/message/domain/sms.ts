import type {IdNameValueMetadata, NameValueEnumMetadata, StringIdEntity,} from '../../commons'
import type {BasicMessageEntity} from './message.ts'

export interface SmsMessageEntity extends BasicMessageEntity {
  channel: NameValueEnumMetadata<string> | string
  phoneNumber: string
  metadata: Record<string, unknown>
  principal: string
  batchId: number
  executeStatus: NameValueEnumMetadata<number> | number
}

export interface SmsMessageSendPayloadMetadata {
  signCode: string
  templateCode: string
  variables: IdNameValueMetadata<string>[]
}

export interface SmsMessageSendPayload {
  channel: NameValueEnumMetadata<string> | string
  phoneNumbers: string[]
  metadata: SmsMessageSendPayloadMetadata
  type: NameValueEnumMetadata<number> | number
  content: string
  remark?: string
}

export interface SmsTemplatePayload extends StringIdEntity {
  channel: NameValueEnumMetadata<string> | string
  name: string
  content: string
  type: NameValueEnumMetadata<number> | number
  metadata?: Record<string, unknown>
  remark?: string
}

export interface SmsTemplateEntity extends SmsTemplatePayload {
  status: NameValueEnumMetadata<number> | number
  auditionTime: number
}

export interface SmsSignPayload extends StringIdEntity {
  channel: NameValueEnumMetadata<string> | string
  name: string
  type?: NameValueEnumMetadata<number> | number
  metadata?: Record<string, unknown>
  remark?: string
}

export interface SmsSignEntity extends SmsSignPayload {
  status: NameValueEnumMetadata<number> | number
  auditionTime: number
}

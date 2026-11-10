import type {NameValueEnumMetadata, ObjectWriteResult, StringIdEntity} from '../../commons'
import type {ExecutionChannel} from '../enumerate.ts'
import type {ModelSettingMetadata} from './modelSetting.ts'

export interface AgentConversationEntity extends StringIdEntity {
  version?: number
  name?: string
  status?: NameValueEnumMetadata<number> | number
  principal?: string
  tenantId?: string
  type: NameValueEnumMetadata<number> | number
  metadata?: Record<string, unknown>
  parentId?: string
  lastModel?: ModelSettingMetadata
  lastChatType?: NameValueEnumMetadata<number> | number
  children?: AgentConversationEntity[]
  key?: string
}

export interface AgentMessageEntity extends StringIdEntity {
  version?: number
  role: NameValueEnumMetadata<string> | string
  agentConversationId: string
  status: NameValueEnumMetadata<number> | number
  parentId?: string
  model: ModelSettingMetadata
  type: NameValueEnumMetadata<number> | number
  media?: string
  metadata?: Record<string, unknown>
  principal?: string
  tenantId?: string
  content: any
}

export interface AgentChatRequestBody {
  channel?: ExecutionChannel
  modelId?: number
  type: number
  content: any
  attachment?: ObjectWriteResult[]
  metadata?: Record<string, unknown>
  agentConversationId?: string
  workspaceId?: string
}

export interface ConfirmResult {
  toolCallId: string
  confirmed: boolean
}

export interface AgentResumeRequestBody {
  channel?: ExecutionChannel
  assistantMessageId: string
  confirmResults: ConfirmResult[]
}

export interface AgentChatBasicResponseBody {
  userMessageId: string
  assistantMessageId: string
}

export interface AgentChatResponseBody extends AgentChatBasicResponseBody {
  conversation: AgentConversationEntity
}

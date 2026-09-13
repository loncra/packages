import type {NameValueEnumMetadata, ObjectWriteResult, VersionEntityMetadata} from '../../commons'
import type {ModelSettingMetadata} from './modelSetting.ts'

export interface AgentConversationEntity extends VersionEntityMetadata {
  name?: string
  status?: NameValueEnumMetadata<number> | number
  principal?: string
  tenantId?: string
  type: NameValueEnumMetadata<number> | number
  metadata?: Record<string, unknown>
  parentId?: number
  lastModel?: ModelSettingMetadata
  lastChatType?: NameValueEnumMetadata<number> | number
  children?: AgentConversationEntity[]
  key?: string
}

export interface AgentMessageEntity extends VersionEntityMetadata {
  role: NameValueEnumMetadata<string> | string
  agentConversationId: number
  status: NameValueEnumMetadata<number> | number
  parentId?: number
  model: ModelSettingMetadata
  type: NameValueEnumMetadata<number> | number
  media?: string
  metadata?: Record<string, unknown>
  principal?: string
  tenantId?: string
  content: any
}

export interface AgentChatRequestBody {
  modelId?: number
  type: number
  content: any
  attachment?: ObjectWriteResult[]
  metadata?: Record<string, unknown>
  agentConversationId?: number
}

export interface ConfirmResult {
  toolCallId: string
  confirmed: boolean
}

export interface AgentResumeRequestBody {
  assistantMessageId: number
  confirmResults: ConfirmResult[]
}

export interface AgentChatBasicResponseBody {
  userMessageId: number
  assistantMessageId: number
}

export interface AgentChatResponseBody extends AgentChatBasicResponseBody {
  conversation: AgentConversationEntity
}

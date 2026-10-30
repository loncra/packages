import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {NameValueEnumMetadata, PageResult} from '@loncra/client/commons'
import type {AI_SERVER_AGENT_CONTENT_TYPE} from '@loncra/client/ai'
import type {AgentConversationRecord} from './conversation'
import type {HistoryBubble} from './history/useAgentHistory'

export interface AgentSession extends AgentConversationRecord {
  loading: boolean
  dataSource: PageResult<HistoryBubble>
}

export type Self = PlatformUser | (UserMetadata & {systemName: string})

export interface AgentSseMessageContent {
  sseEventId: string
  assistantMessageId: number
  id: string
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.THINK
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.ANSWER
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.ERROR
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.TOOL
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.TOKEN_USAGE
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_END
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_STOP
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.STREAM_START
    | typeof AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
}

export interface BlockRunningContentMetadata extends AgentSseMessageContent {
  status: NameValueEnumMetadata<string> | string
  creationTime: number
  endTime?: number
}

export interface CustomizeContentMetadata extends AgentSseMessageContent {
  metadata?: Record<string, unknown>
}

export interface BlockDeltaContentMetadata extends BlockRunningContentMetadata {
  value?: string
}

export interface GenerateConversationName extends CustomizeContentMetadata {
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME
  metadata: {
    name: string
  }
}

export interface AgentStatusChangeSse extends AgentSseMessageContent {
  status: NameValueEnumMetadata<number> | number
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE
}

export interface AgentTokenUsageContent extends AgentSseMessageContent {
  inputTokens: number
  outputTokens: number
  cachedTokens: number
  usageType: NameValueEnumMetadata<string> | string
  type: typeof AI_SERVER_AGENT_CONTENT_TYPE.TOKEN_USAGE
}

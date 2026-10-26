import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {ThoughtChainItemType} from '@antdv-next/x'
import type {
  AgentAnswerBlock,
  AgentContentBlock,
  AgentErrorBlock,
  AgentThinkBlock,
  AgentToolCallBlock,
} from '@loncra/chat-core'

export interface AgentTokenUsage {
  id?: string
  usageType: NameValueEnumMetadata<string> | string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
}

export interface BlockGroup {
  groupId: string
  thinkBlock?: AgentThinkBlock
  answerBlock?: AgentAnswerBlock
  toolBlocks: AgentToolCallBlock[]
  errorBlock?: AgentErrorBlock & {metadata?: {message?: string}}
}

export interface ThoughtChainItemDataType extends ThoughtChainItemType {
  data: AgentToolCallBlock
}

export interface AgentAssistantItem {
  key: string | number
  content: AgentContentBlock[]
  status?: NameValueEnumMetadata<number> | number
}

export interface AgentBubbleFooterItem {
  role: string
  key?: string | number
  content?: ReadonlyArray<{type?: unknown; status?: unknown; value?: unknown}>
  metadata?: {tokenUsage?: AgentTokenUsage[]}
  data?: unknown
  type?: unknown
  model?: {name?: string; manufacturer?: {name?: string}}
}

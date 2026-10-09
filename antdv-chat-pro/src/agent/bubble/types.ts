import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {ThoughtChainItemType} from '@antdv-next/x'
import type {
  AgentAnswerBlock,
  AgentErrorBlock,
  AgentThinkBlock,
  AgentToolCallBlock,
} from '@loncra/chat-core'

/** 用量行。客户端没有单独的 token 结构，字段对齐管理端 AgentTokenUsageContent。 */
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
  errorBlock?: AgentErrorBlock
}

export interface ThoughtChainItemDataType extends ThoughtChainItemType {
  data: AgentToolCallBlock
}

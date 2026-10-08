/**
 * Agent 写进气泡 content 的块。SSE 传输事件（streamStart / streamEnd / tokenUsage /
 * agentStatusChange / generateConversationName）仍留在管理端 agent.ts，不进这里。
 *
 * 来源：vue-basic-admin/src/types/composables/agent.ts 的 AgentThinkBlock、AgentToolCallBlock、
 * AgentAnswerBlock、AgentErrorBlock。公共的 type / value 用 TextBlock，不另写一套。
 */
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {AI_SERVER_AGENT_CONTENT_TYPE} from '@loncra/client/ai'
import type {AgentMessageEntity} from '@loncra/client/ai'
import type {SharedContentBlock, TextBlock} from './content.ts'
import type {ChatBubbleBody, ChatBubbleItem} from './session.ts'
import type {DraftRecordBase} from './draft.ts'

/** 来源：agent.ts AgentSseMessageContent 里会进气泡的身份字段。 */
interface AgentBlockIdentity {
  sseEventId: string
  assistantMessageId: number
  id: string
}

/**
 * 来源：agent.ts BlockDeltaContentMetadata。
 * value 在管理端是可选的；这里写成 string | undefined，才能满足 TextBlock 的 value。
 */
export interface AgentDeltaBlock<TType extends string>
  extends TextBlock<TType, string | undefined>, AgentBlockIdentity {
  status: NameValueEnumMetadata<string> | string
  creationTime: number
  endTime?: number
}

/** 来源：agent.ts AgentThinkBlock */
export interface AgentThinkBlock
  extends AgentDeltaBlock<typeof AI_SERVER_AGENT_CONTENT_TYPE.THINK> {
  expanded?: boolean
}

/** 来源：agent.ts AgentToolCallBlock */
export interface AgentToolCallBlock
  extends AgentDeltaBlock<typeof AI_SERVER_AGENT_CONTENT_TYPE.TOOL> {
  name: string
  outputText?: string
  outputParts?: unknown[]
  resultState?: string
  hitlStatus: string
  userConfirmed?: boolean
  groupId: string
}

/** 来源：agent.ts AgentAnswerBlock */
export interface AgentAnswerBlock
  extends AgentDeltaBlock<typeof AI_SERVER_AGENT_CONTENT_TYPE.ANSWER> {}

/**
 * 来源：agent.ts AgentErrorBlock。
 * 错误正文放在 value。服务端 CustomizeMetadata 仍把这句话写在 metadata.message，
 * 管理端收进气泡时抄到 value。
 */
export interface AgentErrorBlock
  extends TextBlock<typeof AI_SERVER_AGENT_CONTENT_TYPE.ERROR, string>,
    AgentBlockIdentity {}

export type AgentContentBlock =
  | SharedContentBlock
  | AgentThinkBlock
  | AgentToolCallBlock
  | AgentAnswerBlock
  | AgentErrorBlock

/** 约束：Agent 气泡 content 的每一块都是 TextBlock。 */
export type AgentBubbleBody = ChatBubbleBody<AgentContentBlock>

/**
 * Agent 气泡。业务字段来自 AgentMessageEntity（status、model、metadata）。
 * 消息实体的 role 是服务端枚举，气泡 role 是 user / ai / system / divider，不继承前者。
 */
export interface AgentChatBubble
  extends Omit<AgentMessageEntity, 'content' | 'role'>,
    ChatBubbleItem<AgentContentBlock> {}

/** 来源：draft.ts AgentDraftRecord。 */
export interface AgentDraftRecord extends DraftRecordBase {
  scope: 'agent'
  id: string
}

import type {PageResult} from '@loncra/client/commons'
import type {AgentConversationRecord} from './conversation/useAgentConversations'
import type {HistoryBubble} from './history/useAgentHistory'

export interface AgentSession extends AgentConversationRecord {
  loading: boolean
  dataSource: PageResult<HistoryBubble>
}

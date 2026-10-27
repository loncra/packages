import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import type {PageResult} from '@loncra/client/commons'
import type {AgentConversationRecord} from './conversation'
import type {HistoryBubble} from './history/useAgentHistory'

export interface AgentSession extends AgentConversationRecord {
  loading: boolean
  dataSource: PageResult<HistoryBubble>
}

export type Self = PlatformUser | (UserMetadata & {systemName: string})

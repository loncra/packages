import type {AgentConversationEntity} from '@loncra/client/ai'

export interface AgentConversationRecord extends AgentConversationEntity {
  editing?: boolean
  original?: string
}

export interface AgentConversationHost {
  timeText: (unix?: number) => string
  onOpen: (item: AgentConversationRecord) => void
  onOpenPluginMarket: () => void
  afterLoad: (items: AgentConversationRecord[]) => void
}

export type AgentConversationMenuKey = 'create' | 'rename' | 'delete'

export interface AgentConversationActions {
  startCreate: () => void
  startRename: (item: AgentConversationRecord) => void
  cancelEdit: (item: AgentConversationRecord) => void
  confirmEdit: (item: AgentConversationRecord) => void
  remove: (item: AgentConversationRecord) => void
}

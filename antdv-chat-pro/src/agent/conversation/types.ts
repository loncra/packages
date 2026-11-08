import type {ResolvedAction} from '@loncra/antdv-pro'
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
  conversationsLoader?: () => Promise<AgentConversationRecord[]>
  displayName?: (item: AgentConversationRecord) => string | undefined
  iconTone?: (item: AgentConversationRecord) => string | undefined
  menuKeys?: (item: AgentConversationRecord) => AgentConversationMenuKey[] | undefined
  onRemove?: (item: AgentConversationRecord) => Promise<boolean>
  workspaceActions?: (api: {refresh: () => Promise<void>}) => ResolvedAction[]
}

export type AgentConversationMenuKey = 'create' | 'rename' | 'delete'

export interface AgentConversationActions {
  load: (switchItemId?: string) => Promise<void>
  startCreate: () => void
  startRename: (item: AgentConversationRecord) => void
  cancelEdit: (item: AgentConversationRecord) => void
  confirmEdit: (item: AgentConversationRecord) => void
  remove: (item: AgentConversationRecord) => void
}

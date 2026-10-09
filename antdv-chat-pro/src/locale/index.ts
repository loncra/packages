export interface ImConversationLocale {
  search: string
  draft: string
  mention: string
  mentionLine: string
  detail: string
  pin: string
  unpin: string
  mute: string
  unmute: string
  delete: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
}

export interface AgentConversationLocale {
  pluginMarket: string
  workspaceTitle: string
  workspacePlaceholder: string
  createAgent: string
  rename: string
  delete: string
  deleteConfirmTitle: string
  deleteConfirmSingle: string
}

export interface Locale {
  locale: string
  ImConversation?: ImConversationLocale
  AgentConversation?: AgentConversationLocale
}

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

export interface ImBubbleLocale {
  reference: string
  undo: string
  undoConfirmTitle: string
  undoConfirmContent: string
  undoCountdown: string
  reedit: string
  selfUndo: string
  read: string
  unread: string
  readCount: string
  unreadCount: string
  name: string
  readTime: string
  creationTime: string
  me: string
}

export interface AgentBubbleLocale {
  think: string
  toolCall: string
  allow: string
  allowAll: string
  reject: string
  rejectAll: string
  token: string
  tokenTotal: string
  tokenInput: string
  tokenOutput: string
  tokenCache: string
  tokenCacheHitRate: string
}

export interface Locale {
  locale: string
  ImConversation?: ImConversationLocale
  AgentConversation?: AgentConversationLocale
  ImBubble?: ImBubbleLocale
  AgentBubble?: AgentBubbleLocale
}

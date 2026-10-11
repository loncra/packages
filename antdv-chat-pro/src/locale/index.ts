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

export interface ImRoomLocale {
  add: string
  history: string
  setting: string
  name: string
  pinned: string
  muted: string
  open: string
  close: string
  memberManager: string
  addParticipant: string
  changeMember: string
  changeCoOwner: string
  removeMember: string
  removeMemberConfirmTitle: string
  removeMemberConfirmContent: string
  exit: string
  exitConfirmTitle: string
  exitConfirmContent: string
  deleteConversation: string
  deleteConfirmTitle: string
  deleteConfirmContent: string
  disband: string
  disbandConfirmTitle: string
  disbandConfirmContent: string
  renameSuccess: string
}

export interface ImHistoryLocale {
  title: string
  positioning: string
  message: string
  image: string
  video: string
  audio: string
  unknown: string
}

export interface ImCallLocale {
  videoAction: string
  voiceAction: string
  videoTitle: string
  voiceTitle: string
  invitation: string
  closeCountdown: string
  reconnectTimeCountdown: string
  unsupported: string
  captureDenied: string
  unnamed: string
  ignore: string
  accept: string
  rejected: string
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
  ImRoom?: ImRoomLocale
  ImHistory?: ImHistoryLocale
  ImCall?: ImCallLocale
  AgentBubble?: AgentBubbleLocale
}

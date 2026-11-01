export interface ImChatExpose {
  openConversation: (id: number, messageId?: number) => Promise<void>
  setRoomSettingsOpen: (open: boolean) => void
  refreshConversations: () => Promise<void>
  scrollToBottom: () => void
}

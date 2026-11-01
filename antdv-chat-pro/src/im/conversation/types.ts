export interface ImConversationHost {
  timeText: (unix?: number) => string
  unreadCount: (id: string) => number
  principal: () => string
}

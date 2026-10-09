export interface ConversationNode {
  key: string
  name: string
  timeText?: string
  children?: ConversationNode[]
  editing?: boolean
}

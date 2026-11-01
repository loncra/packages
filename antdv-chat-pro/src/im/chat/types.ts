import type {ImChatBubble} from '@loncra/chat-core'
import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from '@loncra/client/message'
import type {ImHistorySession} from '../history/useImHistory'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'

export interface ImChatSession extends ImHistorySession<ImChatBubble> {
  sending: boolean
  item?: {
    key: string
    data?: UserChatConversationResponseBody
  }
}

export interface ImChatViewExpose {
  getScrollBox: () => HTMLElement | undefined
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => void
  scrollTo: (options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }) => void
  persistSenderDraft: () => Promise<void>
  getSenderSlotConfigValue: () => SlotConfigType[]
  applyMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  applyMessageUndo: (message: UserChatMessageEntity) => void
}

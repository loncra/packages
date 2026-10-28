import {ref, type Ref} from 'vue'
import {appendMessages, type ChatRole} from '@loncra/chat-core'
import {emptyPageResult, isEnumValue} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
  MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody,
} from '@loncra/client/message'
import {CHAT_BUBBLE_TYPE} from '@loncra/client/ai'
import type {ImChatSession, ImChatViewExpose} from './chat/ImChatView'
import type {ImConversationsApi} from './conversation/useImConversations'
import {useImHistory} from './history/useImHistory'
import type {ImPageHost} from './host'

export function emptySession(): ImChatSession {
  return {
    item: undefined,
    loading: false,
    sending: false,
    readableAnchorLoading: false,
    isOnLastPage: false,
    isOnFirstPage: true,
    drawerOpen: false,
    participants: [],
    dataSource: emptyPageResult(),
  }
}

export function messageRole(
  message: UserChatMessageResponseBody | UserChatMessageEntity,
  selfSystemName: string,
): ChatRole {
  if (isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
    return CHAT_BUBBLE_TYPE.SYSTEM
  }
  const details = (message as UserChatMessageResponseBody).participant?.metadata?.details as {systemName?: string} | undefined
  const sender = message.principal ?? details?.systemName
  return sender === selfSystemName ? CHAT_BUBBLE_TYPE.USER : CHAT_BUBBLE_TYPE.AI
}

export function useImChatSessions(options: {
  session: ImChatSession
  conversations: ImConversationsApi<UserChatConversationResponseBody>
  history: ReturnType<typeof useImHistory<ImChatSession>>
  viewRef: Ref<ImChatViewExpose | undefined>
  host: ImPageHost
  emitActive: (conversation: UserChatConversationResponseBody | undefined) => void
}) {
  const {session, conversations, history, viewRef, host, emitActive} = options
  const pane = ref<'conversation' | 'contact'>('conversation')

  async function openConversation(id: number, messageId?: number) {
    const found = conversations.findById(id)
    if (!found) {
      return
    }
    if (!Array.isArray(found.draft)) {
      found.draft = []
    }
    session.drawerOpen = false
    await history.switchConversation({
      key: String(found.id),
      data: found,
    }, messageId)
    emitActive(session.item?.data)
  }

  function setRoomSettingsOpen(open: boolean) {
    session.drawerOpen = open
  }

  function applyIncomingMessage(message: UserChatMessageResponseBody | UserChatMessageEntity) {
    if (
      message.principal === host.self.systemName
      && isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.USER)
    ) {
      return
    }
    if (session.item?.data?.room?.id === message.userChatRoomId && viewRef.value) {
      appendMessages(
        message,
        messageRole(message, host.self.systemName),
        session.dataSource.elements,
        false,
        !session.isOnFirstPage,
      )
    }
    conversations.moveToTopByRoomId(message.userChatRoomId, (item) => {
      item.lastUserMessage = message as UserChatMessageEntity
    })
  }

  async function addConversation(conversation: UserChatConversationResponseBody) {
    await host.refreshUnread()
    conversations.unshiftIfAbsent(conversation)
  }

  async function refreshConversationByRoom(roomId: number) {
    if (!conversations.findByRoomId(roomId)) {
      return
    }
    const found = await conversations.refreshByRoomId(roomId)
    if (!found || session.item?.data?.room?.id !== roomId) {
      return
    }
    session.item = {key: String(found.id), data: found}
    emitActive(session.item?.data)
  }

  async function refreshParticipants(roomId: number) {
    const current = session.item?.data
    if (!current || current.room?.id !== roomId) {
      return
    }
    if (!isEnumValue(current.status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED)) {
      return
    }
    await history.loadParticipant(roomId)
  }

  function clearCurrent() {
    session.item = undefined
    emitActive(undefined)
  }

  return {
    pane,
    openConversation,
    setRoomSettingsOpen,
    clearCurrent,
    refreshConversationByRoom,
    refreshParticipants,
    applyIncomingMessage,
    addConversation,
  }
}

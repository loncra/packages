import {onUnmounted} from 'vue'
import type {RestResult} from '@loncra/client/commons'
import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody
} from '@loncra/client/message'
import type {ImChatHost} from '../host.ts'
import {IM_SOCKET_EVENT} from './socketEvents.ts'
import {parseSocketRestPayload} from './parseSocket.ts'

export interface ImSocketEventHandlers {
  onIncomingMessage: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  onMessageRead: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  onMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  onMessageUndo: (message: UserChatMessageEntity) => void
  onConversationCreate: (conversation: UserChatConversationResponseBody) => Promise<void> | void
  onConversationRefresh: () => Promise<void> | void
  onConversationRefreshByRoom: (roomId: number) => Promise<void> | void
  onParticipantRefreshByRoom: (roomId: number) => Promise<void> | void
}

export function useImSocketEvents(options: {host: ImChatHost, handlers: ImSocketEventHandlers}) {
  const disposes: Array<() => void> = []
  const on = (event: string, handler: (payload: unknown) => void) => {
    disposes.push(options.host.subscribe(event, handler))
  }

  on(IM_SOCKET_EVENT.CHAT_MESSAGE, (payload) => {
    const result: RestResult<UserChatMessageResponseBody | UserChatMessageEntity> = parseSocketRestPayload(payload)
    if (result.data) {
      options.handlers.onIncomingMessage(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_MESSAGE_READ, (payload) => {
    const result: RestResult<UserChatMessageResponseBody | UserChatMessageEntity> = parseSocketRestPayload(payload)
    if (result.data) {
      options.handlers.onMessageRead(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_MESSAGE_UPDATE, (payload) => {
    const result: RestResult<UserChatMessageResponseBody | UserChatMessageEntity> = parseSocketRestPayload(payload)
    if (result.data) {
      options.handlers.onMessageUpdate(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_MESSAGE_UNDO, (payload) => {
    const result: RestResult<UserChatMessageEntity> = parseSocketRestPayload(payload)
    if (result.data) {
      options.handlers.onMessageUndo(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_CONVERSATION_CREATE, (payload) => {
    const result: RestResult<UserChatConversationResponseBody> = parseSocketRestPayload(payload)
    if (result.data) {
      void options.handlers.onConversationCreate(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_CONVERSATION_REFRESH, () => {
    void options.handlers.onConversationRefresh()
  })
  on(IM_SOCKET_EVENT.CHAT_CONVERSATION_REFRESH_BY_ROOM_ID, (payload) => {
    const result: RestResult<number> = parseSocketRestPayload(payload)
    if (result.data) {
      void options.handlers.onConversationRefreshByRoom(result.data)
    }
  })
  on(IM_SOCKET_EVENT.CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID, (payload) => {
    const result: RestResult<number> = parseSocketRestPayload(payload)
    if (result.data) {
      void options.handlers.onParticipantRefreshByRoom(result.data)
    }
  })

  onUnmounted(() => {
    disposes.splice(0).forEach((dispose) => dispose())
  })
}

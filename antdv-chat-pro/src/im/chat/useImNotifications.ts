import {onUnmounted} from 'vue'
import type {RestResult} from '@loncra/client/commons'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import type {UserChatConversationResponseBody, UserChatMessageResponseBody} from '@loncra/client/message'
import {
  ChatMessageService,
  MESSAGE_SERVER_MESSAGE_GROUP,
  MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE
} from '@loncra/client/message'
import {AuthServerService} from '@loncra/client/auth'
import {fillLocale} from '@loncra/antdv'
import {useAppNotification} from '@loncra/antdv-pro'
import {useLocale} from '../../_util/useLocale.ts'
import {IM_SOCKET_EVENT} from './socketEvents.ts'
import {parseSocketRestPayload} from './parseSocket.ts'
import {createAvatarNode, useImContentPreview} from './contentPreview.ts'

export interface ImNotificationOptions {
  subscribe: (event: string, handler: (payload: unknown) => void) => () => void
  principal: () => string
  refreshUnread: () => Promise<void>
  shouldNotify: () => boolean
  openChatFromNotification: (conversationId: number, messageId?: number) => void
  notificationDuration: () => number | false | undefined
}

export function useImNotifications(options: ImNotificationOptions) {
  const locale = useLocale('ImChat')
  const {destroy, info, createNotificationDescription} = useAppNotification()
  const preview = useImContentPreview({principal: options.principal})
  const disposes: Array<() => void> = []
  const on = (event: string, handler: (payload: unknown) => void) => {
    disposes.push(options.subscribe(event, handler))
  }

  async function onChatMessageReceived(result: RestResult<UserChatMessageResponseBody>, event: string) {
    if (!result.data || result.data.principal === options.principal()) {
      return
    }

    await options.refreshUnread()

    if (isEnumValue(result.data.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.CALL)) {
      return
    }

    const conversationResult = await ChatMessageService.getConversation(result.data.userChatRoomId, true)
    if (!conversationResult.data) {
      return
    }

    const body: UserChatConversationResponseBody = conversationResult.data as UserChatConversationResponseBody
    let notificationKey = MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT + '_' + body.id
    let description = preview.messagePreview(result.data, body)
    let duration = options.notificationDuration()
    let messageId = undefined
    if (event === IM_SOCKET_EVENT.CHAT_MESSAGE && isEnumValue(body.muted, YES_OR_NO_TYPE.YES)) {
      return
    } else if (event === IM_SOCKET_EVENT.CHAT_MESSAGE_MENTION) {
      const message = result.data

      destroy(notificationKey)
      notificationKey = MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT + '_' + IM_SOCKET_EVENT.CHAT_MESSAGE_MENTION + '_' + message.id

      duration = false
      messageId = message.id

      description = fillLocale(locale.value.mentionNotification, {
        user: '[' + AuthServerService.getPrincipalNameByUserDetails(message.participant.metadata.details) + '] ',
      })
    }

    if (description === '') {
      return
    }

    if (!options.shouldNotify()) {
      return
    }

    await info({
        title: body.name,
        duration: duration,
        description: createNotificationDescription(description),
        icon: createAvatarNode(
          Array.isArray(body.cover) ? body.cover : [],
          body.name || '',
          'large',
        ),
        onClick: () => {
          options.openChatFromNotification(body.id as number, messageId)
          destroy(notificationKey)
        },
      },
      MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT,
      notificationKey
    )
  }

  on(IM_SOCKET_EVENT.CHAT_MESSAGE, (payload) => {
    const result: RestResult<UserChatMessageResponseBody> = parseSocketRestPayload(payload)
    void onChatMessageReceived(result, IM_SOCKET_EVENT.CHAT_MESSAGE)
  })

  on(IM_SOCKET_EVENT.CHAT_MESSAGE_MENTION, (payload) => {
    const result: RestResult<UserChatMessageResponseBody> = parseSocketRestPayload(payload)
    void onChatMessageReceived(result, IM_SOCKET_EVENT.CHAT_MESSAGE_MENTION)
  })

  on(IM_SOCKET_EVENT.CHAT_MESSAGE_UNDO, () => {
    void options.refreshUnread()
  })

  onUnmounted(() => {
    disposes.splice(0).forEach((dispose) => dispose())
  })

  return {destroy}
}

import {ref, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {type RestResult} from '@loncra/client/commons'
import {
  ChatMessageService,
  type UserChatConversationResponseBody,
} from '@loncra/client/message'
import {useLocale} from '../../_util/useLocale'
import type {ImConversationsApi} from '../conversation/useImConversations'

export interface ImRoomActions {
  busy: Ref<boolean>
  rename: (conversation: UserChatConversationResponseBody, name: string) => Promise<boolean>
  remove: (conversation: UserChatConversationResponseBody) => Promise<boolean>
  exit: (roomId: number) => Promise<boolean>
  disband: (roomId: number) => Promise<boolean>
}

export function useImRoomActions(options: {
  conversations: ImConversationsApi<UserChatConversationResponseBody>
}): ImRoomActions {
  const {conversations} = options
  const {message} = useApp()
  const locale = useLocale('ImRoom')
  const busy = ref(false)

  async function run<T>(action: () => Promise<RestResult<T>>, fallback?: string): Promise<RestResult<T> | undefined> {
    busy.value = true
    try {
      const result = await action()
      message.success(result.message || fallback || '')
      return result
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return undefined
    } finally {
      busy.value = false
    }
  }

  async function rename(conversation: UserChatConversationResponseBody, name: string): Promise<boolean> {
    if (!conversation.room?.id) {
      return false
    }
    const result = await run(
      () => ChatMessageService.roomRename(Number(conversation.room!.id), name),
      locale.value.renameSuccess,
    )
    if (!result) {
      return false
    }
    conversations.patch(conversation.id, (item) => {
      item.name = name
    })
    return true
  }

  async function remove(conversation: UserChatConversationResponseBody): Promise<boolean> {
    return Boolean(await run(() => ChatMessageService.deleteConversation([Number(conversation.id)])))
  }

  async function exit(roomId: number): Promise<boolean> {
    return Boolean(await run(() => ChatMessageService.existRoom(Number(roomId))))
  }

  async function disband(roomId: number): Promise<boolean> {
    return Boolean(await run(() => ChatMessageService.disbandRoom(Number(roomId))))
  }

  return {busy, rename, remove, exit, disband}
}

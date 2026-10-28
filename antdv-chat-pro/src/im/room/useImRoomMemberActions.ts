import {ref, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {type RestResult} from '@loncra/client/commons'
import {
  ChatMessageService,
  type UserChatConversationResponseBody,
} from '@loncra/client/message'

export interface ImRoomMemberActions {
  busy: Ref<boolean>
  addParticipants: (
    roomId: number,
    principals: string[],
  ) => Promise<RestResult<UserChatConversationResponseBody> | undefined>
  updateParticipants: (roomId: number, type: number, principals: string[]) => Promise<boolean>
  removeMembers: (roomId: number, principals: string[]) => Promise<boolean>
}

export function useImRoomMemberActions(): ImRoomMemberActions {
  const {message} = useApp()
  const busy = ref(false)

  async function addParticipants(
    roomId: number,
    principals: string[],
  ): Promise<RestResult<UserChatConversationResponseBody> | undefined> {
    busy.value = true
    try {
      return await ChatMessageService.addRoomParticipant(roomId, principals)
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return undefined
    } finally {
      busy.value = false
    }
  }

  async function updateParticipants(roomId: number, type: number, principals: string[]): Promise<boolean> {
    busy.value = true
    try {
      const result = await ChatMessageService.updateParticipantType(roomId, type, principals)
      message.success(result.message)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return false
    } finally {
      busy.value = false
    }
  }

  async function removeMembers(roomId: number, principals: string[]): Promise<boolean> {
    busy.value = true
    try {
      const result = await ChatMessageService.removeRoomParticipant(roomId, principals)
      message.success(result.message)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return false
    } finally {
      busy.value = false
    }
  }

  return {busy, addParticipants, updateParticipants, removeMembers}
}

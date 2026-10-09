import type {RestResult} from '@loncra/client/commons'
import {
  type BasicUserChatConversation,
  ChatMessageService,
} from '@loncra/client/message'

export async function pinImConversations(ids: number[]): Promise<BasicUserChatConversation[]> {
  const result = await ChatMessageService.pinnedConversation(ids)
  return result.data ?? []
}

export async function muteImConversations(ids: number[]): Promise<BasicUserChatConversation[]> {
  const result = await ChatMessageService.mutedConversation(ids)
  return result.data ?? []
}

export async function deleteImConversations(ids: number[]): Promise<RestResult<void>> {
  return ChatMessageService.deleteConversation(ids)
}

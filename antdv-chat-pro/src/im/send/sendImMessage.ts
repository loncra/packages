import type {RestResult} from '@loncra/client/commons'
import {ChatMessageService, type UserChatMessageResponseBody} from '@loncra/client/message'

export function sendImMessage(
  roomId: string,
  body: unknown[],
): Promise<RestResult<UserChatMessageResponseBody>> {
  return ChatMessageService.send(body, roomId)
}

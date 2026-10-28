import {MESSAGE_SERVER_MESSAGE_GROUP} from '@loncra/client/message'

export function callNotificationKey(callId: number): string {
  return `${MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL}_${callId}`
}

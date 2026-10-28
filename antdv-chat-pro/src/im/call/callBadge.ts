import {getEnumValue, isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS,
  USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE,
  USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE,
} from '@loncra/client/message'

export type CallBadgeStatus = 'success' | 'processing' | 'default' | 'error' | 'warning'

export function callParticipantBadgeStatus(
  status: number | NameValueEnumMetadata<number>,
): CallBadgeStatus {
  const value = getEnumValue(status)
  if (USER_CHAT_CALL_PARTICIPANT_ERROR_STATUS_VALUE.includes(value)) {
    return 'error'
  }
  if (USER_CHAT_CALL_PARTICIPANT_PROCESSING_STATUS_VALUE.includes(value)) {
    return 'processing'
  }
  if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.ACTIVE)) {
    return 'success'
  }
  if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CALL_PARTICIPANT_STATUS.NO_ANSWER)) {
    return 'default'
  }
  return 'warning'
}

import {getEnumValue, isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {
  MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
  USER_CHAT_PARTICIPANT_OWNER_TYPE_VALUE,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {SystemUserContactItem} from '../../system-user-panel'

export function isOwnerType(participant: UserChatParticipantEntity): boolean {
  return USER_CHAT_PARTICIPANT_OWNER_TYPE_VALUE.includes(getEnumValue(participant.type))
}

export function participantTypeOf(item: SystemUserContactItem): number | NameValueEnumMetadata<number> | undefined {
  const value = item.participantType
  if (typeof value === 'number' || (value != null && typeof value === 'object' && 'value' in value)) {
    return value as number | NameValueEnumMetadata<number>
  }
  return undefined
}

export function isSelfOwner(participants: UserChatParticipantEntity[], systemName: string): boolean {
  return participants.some((item) =>
    item.principal === systemName
    && isEnumValue(item.type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.OWNER),
  )
}

export function isSelfManager(participants: UserChatParticipantEntity[], systemName: string): boolean {
  return participants.some((item) => item.principal === systemName && isOwnerType(item))
}

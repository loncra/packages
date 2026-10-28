import type {Ref} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionMeasure, InstructionSenderHandle} from '@loncra/antdv-chat'
import {type IdValueMetadata, isEnumValue} from '@loncra/client/commons'
import {
  CHAT_EVERYONE_ID,
  MESSAGE_SERVER_USER_CHAT_ROOM_TYPE,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import type {ImSenderExpose} from '../sender/ImSender'
import type {ImChatSession} from './ImChatView'
import type {ImPageHost} from '../host'

export function useImMentionInstruction(options: {
  session: ImChatSession
  senderRef: Ref<ImSenderExpose | undefined>
  host: ImPageHost
}) {
  const {session, senderRef, host} = options
  const locale = useLocale('ImChat')

  function instructionMap(): Record<string, IdValueMetadata<string, string>[]> | undefined {
    const roomType = session.item?.data?.room?.type
    if (isEnumValue(roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.PRIVATE_CHAT)) {
      return undefined
    }
    const people = session.participants
      .filter((participant) => participant.principal !== host.self.systemName)
      .map((participant) => ({
        id: participant.principal,
        value: AuthServerService.getPrincipalNameByUserDetails(participant.metadata.details),
        metadata: participant as unknown as Record<string, unknown>,
      }))
    return {
      '@': [
        ...people,
        {id: CHAT_EVERYONE_ID, value: locale.value.everyone},
      ],
    }
  }

  function stripMentions(slots: SlotConfigType[]): SlotConfigType[] {
    return slots.filter((slot) => !(slot.type === 'custom' && slot.props?.slotKind === 'instruction'))
  }

  function removeTrailingTrigger(slots: SlotConfigType[], trigger: string): SlotConfigType[] {
    if (!trigger) {
      return slots
    }
    const result = slots.map((slot) => ({...slot}))
    for (let index = result.length - 1; index >= 0; index -= 1) {
      const slot = result[index]
      if (slot?.type !== 'text' || typeof slot.value !== 'string' || !slot.value.endsWith(trigger)) {
        if (slot?.type === 'text') {
          break
        }
        continue
      }
      const next = slot.value.slice(0, -trigger.length)
      if (next === '') {
        result.splice(index, 1)
      } else {
        result[index] = {...slot, value: next}
      }
      break
    }
    return result
  }

  function onSenderInsertInstruction(sender: InstructionSenderHandle, block: object, measure: InstructionMeasure) {
    const slotProps = (block as unknown as {
      props?: {prefix?: string; defaultValue?: IdValueMetadata<string, string>}
    }).props
    if (slotProps?.prefix === '@' && slotProps.defaultValue?.id === CHAT_EVERYONE_ID) {
      const trigger = measure.prefix + measure.keyword
      const kept = stripMentions((sender.getValue().slotConfig ?? []) as SlotConfigType[])
      sender.clear()
      sender.insert([block, {type: 'text', value: ' '}, ...removeTrailingTrigger(kept, trigger)], 'start')
      return
    }
    sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
  }

  function onInstructionFilter(keyword: string, dataSource: IdValueMetadata<string, string>[], prefix: string) {
    if (prefix !== '@' || !senderRef.value) {
      return dataSource
    }
    const existIds = (senderRef.value.getSlotConfigValue() ?? [])
      .filter((slot) => slot.type === 'custom' && slot.props?.slotKind === 'instruction')
      .map((slot) => slot.type === 'custom' ? slot.props?.defaultValue?.id : undefined)
    if (existIds.includes(CHAT_EVERYONE_ID)) {
      return []
    }
    const absent = dataSource.filter((item) => !existIds.includes(item.id))
    if (absent.length === 1 && absent.at(-1)?.id === CHAT_EVERYONE_ID) {
      return []
    }
    const matches = (text: string) => keyword === '' || text.includes(keyword)
    return [
      ...absent.filter((item) => item.id === CHAT_EVERYONE_ID && matches(item.value)),
      ...absent.filter((item) => {
        const participant = item.metadata as unknown as UserChatParticipantEntity | undefined
        return participant?.metadata?.details
          && matches(AuthServerService.getPrincipalNameByUserDetails(participant.metadata.details))
      }),
    ]
  }

  return {instructionMap, onSenderInsertInstruction, onInstructionFilter}
}

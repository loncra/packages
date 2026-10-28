import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {draftRecordId, type DraftCodec, type ImDraftRecord, type PersistableSlot} from '@loncra/chat-core'
import {
  collectBlobsFromSlotConfig,
  persistableToSlotConfig,
  type RestoreDraftSlotFactories,
  slotConfigToPersistable,
} from '../../draft'

export interface ImDraftLive {
  slots: SlotConfigType[]
  refMessages: UserChatMessageResponseBody[]
}

export function previewSlots(slots: PersistableSlot[]): SlotConfigType[] {
  const result: SlotConfigType[] = []
  for (const slot of slots) {
    if (slot.type === 'text') {
      result.push({type: 'text', value: slot.value})
      continue
    }
    if (slot.slotKind === 'files') {
      result.push({
        type: 'custom',
        key: slot.key,
        props: {
          slotKind: 'files',
          defaultValue: slot.files.map((file) => ({
            uid: file.uid,
            name: file.name,
            size: file.size,
            type: file.type,
            response: file.response,
          })),
        },
      })
      continue
    }
    result.push({
      type: 'custom',
      key: slot.key,
      props: {slotKind: 'instruction', prefix: slot.prefix, defaultValue: slot.value},
    })
  }
  return result
}

export function createImDraftCodec(
  factories: RestoreDraftSlotFactories,
): DraftCodec<ImDraftLive, ImDraftRecord> {
  return {
    scope: 'im',
    toRecord(live, ctx) {
      return {
        version: 1,
        scope: 'im',
        id: draftRecordId(ctx.principal, ctx.targetId),
        principal: ctx.principal,
        targetId: ctx.targetId,
        updatedAt: Date.now(),
        slots: slotConfigToPersistable(live.slots),
        refMessages: [...live.refMessages],
      }
    },
    collectBlobs(live) {
      return collectBlobsFromSlotConfig(live.slots)
    },
    fromRecord(record, blobs) {
      return {
        slots: persistableToSlotConfig(record.slots, blobs, factories),
        refMessages: [...record.refMessages],
      }
    },
  }
}

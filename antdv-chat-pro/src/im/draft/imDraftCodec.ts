import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {draftRecordId, type DraftCodec, type ImDraftRecord} from '@loncra/chat-core'
import {
  collectBlobsFromSlotConfig,
  persistableToSlotConfig,
  type RestoreDraftSlotFactories,
  slotConfigToPersistable,
} from '../../draft/persistableSlots.ts'

export interface ImDraftLive {
  slots: SlotConfigType[]
  refMessages: UserChatMessageResponseBody[]
}

/** IM：槽 + 引用条。hydrate 必须注入当前 Sender 的 createFilesSlot。 */
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

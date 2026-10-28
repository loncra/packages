import {reactive} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {isPlaceholderDraft} from '@loncra/chat-core'
import {draftDatabase} from '@loncra/chat-core/dexie'
import {previewSlots} from './draft/imDraftCodec'

export function useImChatDrafts() {
  const storedDrafts = reactive<Record<string, SlotConfigType[]>>({})

  function rememberDraft(roomId: number | undefined, slots: SlotConfigType[]) {
    if (roomId == null) {
      return
    }
    const key = String(roomId)
    if (slots.length > 0 && !isPlaceholderDraft(slots)) {
      storedDrafts[key] = slots
      return
    }
    delete storedDrafts[key]
  }

  async function reloadStoredDrafts(principal: string | undefined): Promise<void> {
    for (const key of Object.keys(storedDrafts)) {
      delete storedDrafts[key]
    }
    if (!principal) {
      return
    }
    const rows = await draftDatabase.imDrafts.where('principal').equals(principal).toArray()
    for (const row of rows) {
      const slots = previewSlots(row.slots)
      if (slots.length > 0) {
        storedDrafts[row.targetId] = slots
      }
    }
  }

  return {storedDrafts, rememberDraft, reloadStoredDrafts}
}

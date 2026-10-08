import {dexieDraftStore} from '@loncra/chat-core/dexie'
import type {DraftBinding} from '../../draft-sender/useDraftSender'
import type {RestoreDraftSlotFactories} from '../../draft/persistableSlots'
import {createImDraftCodec, type ImDraftLive} from './imDraftCodec'

export function createImDraftBinding(options: {
  principal: () => string | undefined
  targetId: () => string | undefined
  factories: RestoreDraftSlotFactories
}): DraftBinding<ImDraftLive> {
  function codec() {
    return createImDraftCodec(options.factories)
  }

  return {
    key() {
      const principal = options.principal()
      const targetId = options.targetId()
      return principal && targetId ? `${principal}:im:${targetId}` : undefined
    },
    async save(live) {
      const principal = options.principal()
      const targetId = options.targetId()
      if (!principal || !targetId) {
        return
      }
      const current = codec()
      await dexieDraftStore.put(
        current.toRecord(live, {principal, targetId}),
        current.collectBlobs(live),
      )
    },
    async load() {
      const principal = options.principal()
      const targetId = options.targetId()
      if (!principal || !targetId) {
        return null
      }
      const stored = await dexieDraftStore.get('im', principal, targetId)
      if (!stored || stored.record.scope !== 'im') {
        return null
      }
      return codec().fromRecord(stored.record, stored.blobs)
    },
    async clear() {
      const principal = options.principal()
      const targetId = options.targetId()
      if (!principal || !targetId) {
        return
      }
      await dexieDraftStore.clear('im', principal, targetId)
    },
  }
}

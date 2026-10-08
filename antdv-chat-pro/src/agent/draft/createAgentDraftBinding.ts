import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {dexieDraftStore} from '@loncra/chat-core/dexie'
import type {DraftBinding} from '../../draft-sender/useDraftSender'
import type {RestoreDraftSlotFactories} from '../../draft/persistableSlots'
import {createAgentDraftCodec} from './agentDraftCodec'

export function createAgentDraftBinding(options: {
  principal: () => string | undefined
  targetId: () => string | undefined
  factories: RestoreDraftSlotFactories
}): DraftBinding<SlotConfigType[]> {
  function codec() {
    return createAgentDraftCodec(options.factories)
  }

  return {
    key() {
      const principal = options.principal()
      const targetId = options.targetId()
      return principal && targetId ? `${principal}:agent:${targetId}` : undefined
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
      const stored = await dexieDraftStore.get('agent', principal, targetId)
      if (!stored || stored.record.scope !== 'agent') {
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
      await dexieDraftStore.clear('agent', principal, targetId)
    },
  }
}

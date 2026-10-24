import type {Ref} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionSenderHandle} from '@loncra/antdv-chat'
import type {DraftRestoreResult} from '@loncra/chat-core'

export interface DraftBinding<TLive> {
  key: () => string | undefined
  save: (live: TLive) => Promise<void>
  load: () => Promise<TLive | null>
  clear: () => Promise<void>
}

export interface UseDraftSenderOptions<TLive> {
  slots: Ref<SlotConfigType[]>
  binding: () => DraftBinding<TLive>
  readLive: () => TLive
  slotsOf: (live: TLive) => SlotConfigType[]
  onRestore: (result: DraftRestoreResult<TLive, SlotConfigType[]>) => void
  saveSource?: () => unknown
}

export interface DraftSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
}

import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionSenderHandle} from '@loncra/antdv-chat'
import type {ImContentBlock} from '@loncra/chat-core'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'

export interface ImSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
  convertContentBlockToSlotConfig: (content: ImContentBlock[]) => SlotConfigType[]
  createFilesSlot: (files: UploadFile<ObjectWriteResult>[], key?: string) => SlotConfigType
}

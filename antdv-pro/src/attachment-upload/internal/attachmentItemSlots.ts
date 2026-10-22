import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'

type AttachmentItemSlot = (ctx: {file: UploadFile<ObjectWriteResult>}) => unknown

export type AttachmentItemSlots = {
  itemRender?: AttachmentItemSlot
  itemIcon?: AttachmentItemSlot
  itemTitle?: AttachmentItemSlot
  itemDescription?: AttachmentItemSlot
}

export function pickItemSlots(slots: AttachmentItemSlots): AttachmentItemSlots {
  return {
    itemRender: slots.itemRender ? (ctx) => slots.itemRender!(ctx) : undefined,
    itemIcon: slots.itemIcon ? (ctx) => slots.itemIcon!(ctx) : undefined,
    itemTitle: slots.itemTitle ? (ctx) => slots.itemTitle!(ctx) : undefined,
    itemDescription: slots.itemDescription ? (ctx) => slots.itemDescription!(ctx) : undefined,
  }
}

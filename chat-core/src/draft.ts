/**
 * 草稿信封。Dexie、400ms 防抖留在以后的 useChatDraft。
 * 来源：vue-basic-admin/src/types/composables/chat/draft.ts。
 * IM 记录在 im.ts，Agent 记录在 agent.ts。入库槽用 key，不是词槽 id，所以不继承 CustomBlock。
 *
 * Sender 活槽带 customRender / originFileObj，不能整段进 IndexedDB。
 * File 本体进 blobs；这里只留元数据。
 */
import type {ObjectWriteResult} from '@loncra/client/commons'

/** 来源：draft.ts PersistableUploadFile */
export interface PersistableUploadFile {
  uid: string
  name: string
  size: number
  type: string
  response?: ObjectWriteResult
}

/**
 * 来源：draft.ts PersistableSlot。
 * 文本槽与 TextBlock 同形。自定义槽只入库 files / instruction，字段是存储形状，不是气泡词槽。
 */
export type PersistableSlot =
  | {type: 'text'; value: string}
  | {type: 'custom'; slotKind: 'files'; key: string; files: PersistableUploadFile[]}
  | {
      type: 'custom'
      slotKind: 'instruction'
      key: string
      prefix: string
      value: {id: string; value: string}
    }

/** 来源：draft.ts DraftRecordBase。targetId：IM = room.id，Agent = 会话 id。 */
export interface DraftRecordBase {
  version: 1
  principal: string
  scope: string
  targetId: string
  updatedAt: number
  slots: PersistableSlot[]
}

/** 来源：draft.ts DraftBlobRow。主键带 principal，登出按用户整表清。 */
export interface DraftBlobRow {
  id: string
  principal: string
  file: File
}

/** 来源：draft.ts DraftCodec。存储层只认记录和 blobs。 */
export interface DraftCodec<TLive, TRecord extends DraftRecordBase> {
  readonly scope: TRecord['scope']
  toRecord(live: TLive, ctx: {principal: string; targetId: string}): TRecord
  collectBlobs(live: TLive): Map<string, File>
  fromRecord(record: TRecord, blobs: Map<string, File>): TLive
}

/** 来源：draft.ts draftRecordId。同一浏览器多账号互不覆盖。 */
export function draftRecordId(principal: string, targetId: string): string {
  return `${principal}:${targetId}`
}

/** 来源：draft.ts draftBlobId */
export function draftBlobId(principal: string, fileUid: string): string {
  return `${principal}:${fileUid}`
}

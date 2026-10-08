/**
 * 草稿信封与存储口。
 * 来源：vue-basic-admin/src/types/composables/chat/draft.ts。
 * IM 记录在 im.ts，Agent 记录在 agent.ts。入库槽用 key，不是词槽 id，所以不继承 CustomBlock。
 *
 * Sender 活槽带 customRender / originFileObj，不能整段进数据库。
 * File 本体进 blobs；这里只留元数据。
 * DraftStore 只认已经编好的记录。Dexie 不从本文件导出。
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

/** get 命中时的一笔。没有行时 DraftStore.get 返回 null，不返回空槽数组。 */
export interface DraftStored<TRecord extends DraftRecordBase = DraftRecordBase> {
  record: TRecord
  blobs: Map<string, File>
}

/**
 * 存储口。put / get / clear 的键是 scope + principal + targetId。
 * 实现由调用方传入；本包主入口不绑定 Dexie。
 */
export interface DraftStore<TRecord extends DraftRecordBase = DraftRecordBase> {
  put(record: TRecord, blobs?: Map<string, File>): Promise<void>
  get(scope: string, principal: string, targetId: string): Promise<DraftStored<TRecord> | null>
  clear(scope: string, principal: string, targetId: string): Promise<void>
}

/** decideDraftRestore 的返回。applySlots 为真时调用方才把词槽写回 Sender。 */
export interface DraftRestoreDecision<TSlots> {
  found: boolean
  applySlots: boolean
  slots: TSlots | null
}

/**
 * 还原给宿主的结果。slots 是词槽数组；没有记录时为 null。
 * live 由调用方在 fromRecord 之后填上，IM 从里面取引用条。decideDraftRestore 不产生 live。
 */
export interface DraftRestoreResult<TLive, TSlots = unknown> extends DraftRestoreDecision<TSlots> {
  live: TLive | null
}

/** 没有槽，或每一项都是空白 text。附件 / 点名芯片不是占位。 */
export function isPlaceholderDraft(
  slots: ReadonlyArray<{type: string; value?: unknown}> | null | undefined,
): boolean {
  if (!slots?.length) {
    return true
  }
  return slots.every((slot) => slot.type === 'text' && !String(slot.value ?? '').trim())
}

/**
 * storedSlots 为 null 表示库里没有记录。
 * 有记录且内存是占位稿才 applySlots；内存已有内容时仍返回词槽，但不覆盖。
 */
export function decideDraftRestore<TSlots>(
  storedSlots: TSlots | null,
  memoryIsPlaceholder: boolean,
): DraftRestoreDecision<TSlots> {
  if (storedSlots == null) {
    return {found: false, applySlots: false, slots: null}
  }
  return {
    found: true,
    applySlots: memoryIsPlaceholder,
    slots: storedSlots,
  }
}

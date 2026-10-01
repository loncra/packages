import type {ObjectWriteResult} from '@loncra/client/resource'

/**
 * 本机草稿入库形状（可 JSON 克隆）。
 *
 * Sender 活槽带 `customRender` / `originFileObj`，不能整段进 IndexedDB。
 * File 本体进 `blobs` 表，这里只留元数据；点名芯片只留 prefix + id/value。
 */
export interface PersistableUploadFile {
  uid: string
  name: string
  size: number
  type: string
  response?: ObjectWriteResult
}

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

export interface DraftRecordBase {
  version: 1
  /**
   * 主键 —— **派生值**（`principal + ':' + targetId`）：一律用 `draftRecordId(principal, targetId)` 生成，
   * **别手写**（域记录里无需重复声明）。
   */
  id: string
  principal: string
  /**
   * **域的判别键**：子类必须收窄成字面量（`'im'` / `'agent'`）。
   * 它决定"**选哪张表 / 哪个 codec**"，并驱动跨表操作（LRU 驱逐合并两表后要按它回去删）。
   */
  scope: string
  /**
   * **本记录的归属目标**（域自定义）：IM 传房间 id、Agent 传会话 id —— 规范只约定"它是目标标识"，
   * **不写死域语义**。
   *
   * ⚠️ **不能删**：① 它是主键的**原始部件**（`draftRecordId`）；② **不能从 `id` 反解**
   * （`principal` 可能含 `:`，如邮箱）⇒ 必须存原始字段；③ `clearDraft` / `evictOldestDraft` /
   * `putDraft` 都直接用它。
   */
  targetId: string
  updatedAt: number
  slots: PersistableSlot[]
}

/** IndexedDB 可存 File；主键带 principal，登出按用户整表清。 */
export interface DraftBlobRow {
  id: string
  principal: string
  file: File
}

/**
 * 业务 live ↔ 记录。Dexie 只认记录 + blobs，不知道 IM 引用 / Agent 点名。
 * ⚠️ `scope` 与记录的 `scope` 必须一致（同一个判别键的镜像）。
 */
export interface DraftCodec<TLive, TRecord extends DraftRecordBase> {
  readonly scope: TRecord['scope']
  toRecord(live: TLive, ctx: {principal: string; targetId: string}): TRecord
  collectBlobs(live: TLive): Map<string, File>
  fromRecord(record: TRecord, blobs: Map<string, File>): TLive
}

/** 记录主键 —— `principal + ':' + targetId`（纯函数；同一浏览器多账号互不覆盖）。 */
export function draftRecordId(principal: string, targetId: string): string {
  return `${principal}:${targetId}`
}

/**
 * Blob 主键 —— `principal + ':' + fileUid`。
 * ⚠️ 与 `draftRecordId` 同源（都带 principal）：`id` 不能反解出 `targetId`（principal 可能含 `:`，如邮箱）。
 */
export function draftBlobId(principal: string, fileUid: string): string {
  return `${principal}:${fileUid}`
}

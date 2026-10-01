import Dexie, {type EntityTable} from 'dexie'
import type {DraftBlobRow, DraftRecordBase} from '@loncra/chat-core'

/**
 * 本机草稿库。IM / Agent 分表是因为记录形状不同（IM 有 refMessages），
 * blobs 共用，避免 File 再拆两套。
 *
 * 库名固定 `chat-drafts`：换产品名也不改，否则用户本机已有草稿对不上。
 * 索引：`principal` 登出批量删；`updatedAt` 配额满时 LRU 驱逐。
 *
 * ⚠️ 表按**基座**（`DraftRecordBase`）声明，不是按域记录：Dexie 只用
 * `id / principal / targetId / updatedAt` 建索引，各域的额外字段（IM 的 `refMessages`）只是载荷
 * ⇒ 共享层**不需要**认识域类型（域记录仍住 `vue-basic-admin/src/types/composables/chat/draft.ts`）。
 * 具体记录类型由 `getDraft<TR>()` 的调用方给出。
 */
export class DraftDatabase extends Dexie {
  imDrafts!: EntityTable<DraftRecordBase, 'id'>
  agentDrafts!: EntityTable<DraftRecordBase, 'id'>
  blobs!: EntityTable<DraftBlobRow, 'id'>

  constructor() {
    super('chat-drafts')
    this.version(1).stores({
      imDrafts: 'id, principal, targetId, updatedAt',
      agentDrafts: 'id, principal, targetId, updatedAt',
      blobs: 'id, principal',
    })
  }
}

export const draftDatabase = new DraftDatabase()

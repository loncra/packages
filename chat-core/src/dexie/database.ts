import Dexie, {type EntityTable} from 'dexie'
import type {AgentDraftRecord} from '../agent.ts'
import type {DraftBlobRow} from '../draft.ts'
import type {ImDraftRecord} from '../im.ts'

/**
 * 本机草稿库。IM / Agent 分表是因为记录形状不同（IM 有 refMessages），
 * blobs 共用，避免 File 再拆两套。
 *
 * 库名固定 `chat-drafts`：换产品名也不改，否则用户本机已有草稿对不上。
 * 索引：`principal` 登出批量删；`updatedAt` 配额满时 LRU 驱逐。
 */
export class DraftDatabase extends Dexie {
  imDrafts!: EntityTable<ImDraftRecord, 'id'>
  agentDrafts!: EntityTable<AgentDraftRecord, 'id'>
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

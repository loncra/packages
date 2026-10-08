import type {AgentDraftRecord} from '../agent.ts'
import {
  draftBlobId,
  type DraftRecordBase,
  type DraftStore,
  type DraftStored,
  draftRecordId,
  type PersistableSlot,
} from '../draft.ts'
import type {ImDraftRecord} from '../im.ts'
import {type DraftDatabase, draftDatabase} from './database.ts'

/** 单文件上限；超限整笔不写，避免半截稿。 */
const MAX_DRAFT_BLOB_BYTES = 50 * 1024 * 1024
/** QuotaExceeded 时按该用户 updatedAt LRU 删最旧稿，再重试。 */
const QUOTA_EVICT_TRIES = 8

type DraftRecord = ImDraftRecord | AgentDraftRecord

export class DraftBlobTooLargeError extends Error {
  readonly fileUid: string
  readonly size: number

  constructor(fileUid: string, size: number) {
    super(`草稿文件超过 50MB: ${fileUid}`)
    this.name = 'DraftBlobTooLargeError'
    this.fileUid = fileUid
    this.size = size
  }
}

function isImRecord(record: DraftRecordBase): record is ImDraftRecord {
  return record.scope === 'im'
}

function collectFileUids(slots: PersistableSlot[]): string[] {
  const uids: string[] = []
  for (const slot of slots) {
    if (slot.type === 'custom' && slot.slotKind === 'files') {
      for (const file of slot.files) {
        uids.push(file.uid)
      }
    }
  }
  return uids
}

/** 空稿不留行：否则列表「[草稿]」和 hydrate 会当成有内容。引用条单独也算有稿。 */
function isEmptyDraft(record: DraftRecordBase): boolean {
  for (const slot of record.slots) {
    if (slot.type === 'text' && slot.value.trim().length > 0) {
      return false
    }
    if (slot.type === 'custom' && slot.slotKind === 'files' && slot.files.length > 0) {
      return false
    }
    if (slot.type === 'custom' && slot.slotKind === 'instruction') {
      return false
    }
  }
  return !(isImRecord(record) && record.refMessages.length > 0)
}

function assertBlobSizes(blobs: Map<string, File>): void {
  for (const [uid, file] of blobs) {
    if (file.size > MAX_DRAFT_BLOB_BYTES) {
      throw new DraftBlobTooLargeError(uid, file.size)
    }
  }
}

/**
 * 默认 DraftStore。空稿删行，单文件超过 50MB 整笔拒绝，配额不足时按该用户最旧稿淘汰后再写。
 * 登出清用户全部稿不在 DraftStore 上，用 clearPrincipalDrafts。
 */
export function createDexieDraftStore(database: DraftDatabase = draftDatabase): DraftStore<DraftRecord> {
  async function deleteBlobsForUids(principal: string, uids: string[]): Promise<void> {
    const ids = [...new Set(uids)].map((uid) => draftBlobId(principal, uid))
    if (ids.length === 0) {
      return
    }
    await database.blobs.bulkDelete(ids)
  }

  async function readRecord(scope: string, id: string): Promise<DraftRecord | undefined> {
    if (scope === 'im') {
      return database.imDrafts.get(id)
    }
    return database.agentDrafts.get(id)
  }

  async function writeRecord(record: DraftRecord): Promise<void> {
    if (isImRecord(record)) {
      await database.imDrafts.put(record)
      return
    }
    await database.agentDrafts.put(record)
  }

  async function deleteRecord(scope: string, id: string): Promise<void> {
    if (scope === 'im') {
      await database.imDrafts.delete(id)
      return
    }
    await database.agentDrafts.delete(id)
  }

  async function clear(scope: string, principal: string, targetId: string): Promise<void> {
    const id = draftRecordId(principal, targetId)
    await database.transaction(
      'rw',
      database.imDrafts,
      database.agentDrafts,
      database.blobs,
      async () => {
        const existing = await readRecord(scope, id)
        if (existing) {
          await deleteBlobsForUids(principal, collectFileUids(existing.slots))
        }
        await deleteRecord(scope, id)
      },
    )
  }

  async function evictOldestDraft(principal: string): Promise<boolean> {
    const [imRows, agentRows] = await Promise.all([
      database.imDrafts.where('principal').equals(principal).sortBy('updatedAt'),
      database.agentDrafts.where('principal').equals(principal).sortBy('updatedAt'),
    ])
    const oldest = [...imRows, ...agentRows].sort((a, b) => a.updatedAt - b.updatedAt)[0]
    if (!oldest) {
      return false
    }
    await clear(oldest.scope, oldest.principal, oldest.targetId)
    return true
  }

  function isQuotaExceeded(error: unknown): boolean {
    if (error instanceof DOMException) {
      return error.name === 'QuotaExceededError'
    }
    return error instanceof Error && error.name === 'QuotaExceededError'
  }

  async function putOnce(record: DraftRecord, blobs: Map<string, File>): Promise<void> {
    const id = draftRecordId(record.principal, record.targetId)
    const recordToWrite = {...record, id} as DraftRecord

    await database.transaction(
      'rw',
      database.imDrafts,
      database.agentDrafts,
      database.blobs,
      async () => {
        const existing = await readRecord(recordToWrite.scope, id)
        const nextUids = new Set(collectFileUids(recordToWrite.slots))
        if (existing) {
          const stale = collectFileUids(existing.slots).filter((uid) => !nextUids.has(uid))
          await deleteBlobsForUids(recordToWrite.principal, stale)
        }
        await writeRecord(recordToWrite)
        const blobRows = [...blobs.entries()].map(([uid, file]) => ({
          id: draftBlobId(recordToWrite.principal, uid),
          principal: recordToWrite.principal,
          file,
        }))
        if (blobRows.length > 0) {
          await database.blobs.bulkPut(blobRows)
        }
      },
    )
  }

  return {
    async put(record, blobs = new Map()) {
      if (isEmptyDraft(record)) {
        await clear(record.scope, record.principal, record.targetId)
        return
      }
      assertBlobSizes(blobs)
      let lastError: unknown
      for (let attempt = 0; attempt <= QUOTA_EVICT_TRIES; attempt++) {
        try {
          await putOnce(record, blobs)
          return
        } catch (error) {
          lastError = error
          if (!isQuotaExceeded(error) || attempt === QUOTA_EVICT_TRIES) {
            throw error
          }
          const evicted = await evictOldestDraft(record.principal)
          if (!evicted) {
            throw error
          }
        }
      }
      throw lastError
    },

    async get(scope, principal, targetId): Promise<DraftStored<DraftRecord> | null> {
      const id = draftRecordId(principal, targetId)
      const record = await readRecord(scope, id)
      if (!record) {
        return null
      }
      const uids = collectFileUids(record.slots)
      const blobs = new Map<string, File>()
      if (uids.length === 0) {
        return {record, blobs}
      }
      const rows = await database.blobs.bulkGet(uids.map((uid) => draftBlobId(principal, uid)))
      for (let i = 0; i < uids.length; i++) {
        const uid = uids[i]
        const row = rows[i]
        if (uid && row?.file) {
          blobs.set(uid, row.file)
        }
      }
      return {record, blobs}
    },

    clear,
  }
}

export const dexieDraftStore = createDexieDraftStore()

/** 登出清该用户全部草稿，避免下一账号看到上一账号未发送文件。 */
export async function clearPrincipalDrafts(
  principal: string,
  database: DraftDatabase = draftDatabase,
): Promise<void> {
  await database.transaction(
    'rw',
    database.imDrafts,
    database.agentDrafts,
    database.blobs,
    async () => {
      await database.imDrafts.where('principal').equals(principal).delete()
      await database.agentDrafts.where('principal').equals(principal).delete()
      await database.blobs.where('principal').equals(principal).delete()
    },
  )
}

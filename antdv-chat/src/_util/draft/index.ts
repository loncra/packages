/**
 * 草稿（本机持久化，IndexedDB/Dexie）。IM 与 Agent **共用这一份**。
 *
 * 分层：
 * - **契约**在 `@loncra/chat-core`（`DraftRecordBase` / `DraftBlobRow` / `DraftCodec` / `Persistable*` / `draftRecordId`）；
 * - **这里**是共享实现（库 + 仓库 + 槽转换），**只认基座字段**，不认识域记录；
 * - **域记录与 codec 仍住宿主**（`types/composables/chat/draft.ts` + `composables/chat/draft/*Codec.ts`，S3/S4 随域迁入）。
 */
export {DraftDatabase, draftDatabase} from './database.ts'
export {
  DraftBlobTooLargeError,
  clearDraft,
  clearPrincipal,
  getDraft,
  putDraft,
} from './repository.ts'
export {
  collectBlobsFromSlotConfig,
  persistableToSlotConfig,
  slotConfigToPersistable,
} from './slots.ts'
export type {RestoreDraftSlotFactories, RestoreInstructionBlock} from './slots.ts'

import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {type DraftCodec, type DraftRecordBase, draftRecordId} from '@loncra/chat-core'
import {
    collectBlobsFromSlotConfig,
    persistableToSlotConfig,
    type RestoreDraftSlotFactories,
    slotConfigToPersistable,
} from '../_util/draft'

/**
 * IM 的草稿**记录**与 codec（迁自宿主 `types/composables/chat/draft.ts:22-25` +
 * `composables/chat/draft/imDraftCodec.ts`，2026-10-03 Step 2）。
 *
 * 记录类型**住域里**（不上升 core）：`refMessages` 是 IM 独有的载荷，core 只认基座
 * （`DraftRecordBase`：`version` / `id` / `principal` / `scope` / `targetId` / `updatedAt` / `slots`）。
 */
export interface ImDraftRecord extends DraftRecordBase {
  scope: 'im'
  /** IM 引用条只挂在本记录上，**禁止**塞进公共信封 */
  refMessages: UserChatMessageResponseBody[]
}

/** 内存里的"活稿"：Sender 的 `slotConfig` + 引用条 */
export interface ImDraftLive {
  slots: SlotConfigType[]
  refMessages: UserChatMessageResponseBody[]
}

/**
 * IM：槽 + 引用条。
 *
 * ⚠️ `factories.restoreFilesSlot` **必须注入当前 Sender 实例的 `createFilesSlot`**：
 * 它的 `customRender` 闭包里才是这份 `uploadRefMap`，否则还原出来的芯片点发送没法 upload。
 */
export function createImDraftCodec(
  factories: RestoreDraftSlotFactories,
): DraftCodec<ImDraftLive, ImDraftRecord> {
  return {
    scope: 'im',
    toRecord: (live, ctx) => ({
      version: 1,
      scope: 'im',
      // 主键是**派生值**（`principal:targetId`）—— 一律用 `draftRecordId`，别手写
      id: draftRecordId(ctx.principal, ctx.targetId),
      principal: ctx.principal,
      targetId: ctx.targetId,
      updatedAt: Date.now(),
      slots: slotConfigToPersistable(live.slots),
      refMessages: [...live.refMessages],
    }),
    collectBlobs: (live) => collectBlobsFromSlotConfig(live.slots),
    fromRecord: (record, blobs) => ({
      slots: persistableToSlotConfig(record.slots, blobs, factories),
      refMessages: [...record.refMessages],
    }),
  }
}

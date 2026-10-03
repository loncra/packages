import {nextTick, onMounted, onUnmounted, type Ref, watch} from 'vue'
import {debounce} from 'lodash-es'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {clearDraft, getDraft, putDraft, type RestoreDraftSlotFactories,} from '../_util/draft'
import {createImDraftCodec, type ImDraftRecord} from './imDraftCodec'
import type {ImRuntime} from './useImChatContext'

/**
 * 把当前输入框接到 IndexedDB（迁自宿主 `composables/message-server/chat/useImDraftPersist.ts`，2026-10-03 Step 2）。
 *
 * 内存 `conversation.draft` **仍是活槽**（会话列表的「[草稿]」读它）；IDB 只负责**刷新后恢复**。
 * 四条纪律（宿主原注释）：
 * 1. **切会话**：loader 先把 Sender 写回内存再 persist（必须用**当时**的 roomId）；
 * 2. **输入**：防抖写盘，且**不要把 `getSlotConfigValue()` 写回绑定中的 slot-config**
 *    （否则编辑器会整表重建）；
 * 3. **hydrate**：仅当内存是空占位时才用 IDB 覆盖；本会话已有输入则以内存为准；
 *    引用条没有单独的内存模型，**有记录就填回**；
 * 4. **主键是房间**（不是会话 id）：同一房间的多个会话条目共用一份草稿。
 *
 * ⚠️ 宿主那版还要 `configProviderStore` + `currentInstance` —— 那只为造"点名芯片"的 `customRender`
 * ⇒ 模块里改成**由 `l-im` 注入工厂**（芯片形状/渲染/元数据归宿主，见包 README）。
 */
export interface UseImDraftOptions {
  /** 模块运行时（**必须由 `l-im` 传**：它自己 provide 的自己 inject 不到，见 `useImMessageList`） */
  runtime: ImRuntime
  /** 发送器实例（Step 3 的发送器要满足 `ImDraftSenderExpose`） */
  senderRef: Ref<ImDraftSenderExpose | null | undefined>
  /** 引用条（模块自己持这份状态；hydrate 时按房间填回） */
  refMessages: Ref<UserChatMessageResponseBody[]>
  /**
   * 还原"点名芯片"的工厂 —— **由 `l-im` 从宿主注入**（与 `InstructionSender` 的
   * `createInstructionSlot` prop 同源；宿主今天在 `useImDraftPersist.ts:80-81` 内部直接调它）。
   * ⚠️ `ImProps` 目前**还没有**这个成员 ⇒ **Step 3 补一个 prop**（本 hook 只要求"拿到工厂"）。
   */
  restoreInstructionSlot: RestoreDraftSlotFactories['restoreInstructionSlot']
}

/** 发送器实例必须满足的形状（= 宿主 `useImDraftPersist.ts:23-29` 的 `ImDraftSenderExpose`） */
export interface ImDraftSenderExpose {
  /**
   * 造"附件芯片"。⚠️ **必须用当前实例的**这个函数：它的 `customRender` 闭包里是这份 `uploadRefMap`。
   */
  createFilesSlot(files: UploadFile<ObjectWriteResult>[], key?: string): SlotConfigType
  getSlotConfigValue(): SlotConfigType[]
}

/** 防抖时长（宿主原值） */
const PERSIST_DEBOUNCE_MS = 400

/** 空稿判定：**仅空白 text** 视为空；有附件 / @ 芯片则以内存为准，不用 IDB 覆盖（宿主原话） */
function isPlaceholderDraft(slots: SlotConfigType[] | undefined): boolean {
  if (!slots?.length) {
    return true
  }
  return slots.every((slot) => slot.type === 'text' && !String(slot.value ?? '').trim())
}

export function useImDraft(options: UseImDraftOptions) {
  const {runtime, senderRef, refMessages, restoreInstructionSlot} = options
  const {port, activeConversation} = runtime

  // hydrate 回写 `draft` / `refMessages` 会触发 `@change` 与 `watch` ⇒ 必须跳过写盘，否则刚还原又被空稿盖掉
  let hydrating = false

  /** IM 主键是**房间**不是会话 id：同一房间多会话条目共用一份草稿 */
  function getTargetId(): string | undefined {
    const roomId = activeConversation.value?.room?.id
    return roomId == null ? undefined : String(roomId)
  }

  function getCodec() {
    const createFilesSlot = senderRef.value?.createFilesSlot
    return createImDraftCodec({
      restoreFilesSlot: createFilesSlot ? (files, key) => createFilesSlot(files, key) : undefined,
      restoreInstructionSlot,
    })
  }

  /** 当前活稿：**Sender 的槽优先**，Sender 还没挂就用会话实体上的那份 */
  function currentLive() {
    return {
      slots: senderRef.value?.getSlotConfigValue() ?? activeConversation.value?.draft ?? [],
      refMessages: [...refMessages.value],
    }
  }

  async function persistSenderDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = port.getPrincipal()
    const targetId = getTargetId()
    if (!principal || !targetId || hydrating) {
      return
    }
    const live = currentLive()
    const codec = getCodec()
    try {
      await putDraft(codec.toRecord(live, {principal, targetId}), codec.collectBlobs(live))
    } catch {
      // IndexedDB 不可用 / 单文件超限（`DraftBlobTooLargeError`）时不阻断切会话与输入（宿主同款）
    }
  }

  const persistDebounced = debounce(() => {
    void persistSenderDraft()
  }, PERSIST_DEBOUNCE_MS)

  /** 输入变化时的**防抖**写盘（发送器 `@change` / 重编辑时调） */
  function schedulePersist(): void {
    if (hydrating) {
      return
    }
    persistDebounced()
  }

  /** 切到某个会话后还原草稿（`l-im` 在 `activate` 之后调；loader 也经 `view.hydrateSenderDraft()` 调） */
  async function hydrateSenderDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = port.getPrincipal()
    const targetId = getTargetId()
    const conversation = activeConversation.value
    if (!principal || !targetId || !conversation) {
      refMessages.value = []
      return
    }
    hydrating = true
    try {
      // 包内只认基座 ⇒ 记录类型由这里指定（`ImDraftRecord`）
      const stored = await getDraft<ImDraftRecord>('im', principal, targetId)
      if (!stored) {
        refMessages.value = []
        return
      }
      // Sender 按房间 `:key` 重建：hydrate 要等新实例的 `createFilesSlot`，否则芯片没有 customRender
      for (let i = 0; i < 3 && !senderRef.value?.createFilesSlot; i++) {
        await nextTick()
      }
      const live = getCodec().fromRecord(stored.record, stored.blobs)
      // 内存已有输入则保留；仅占位时用 IDB 覆盖
      if (isPlaceholderDraft(conversation.draft)) {
        conversation.draft = live.slots
      }
      // 引用条不在会话体上；有 IDB 记录就按房间填，避免切会话串到上一房间
      refMessages.value = live.refMessages
    } finally {
      hydrating = false
    }
  }

  /** 发送成功后清 IDB（失败不清 ⇒ 刷新后还能重试） */
  async function clearPersistedDraft(): Promise<void> {
    persistDebounced.cancel()
    const principal = port.getPrincipal()
    const targetId = getTargetId()
    if (!principal || !targetId) {
      return
    }
    await clearDraft('im', principal, targetId)
  }

  function onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      void persistSenderDraft()
    }
  }

  function onBeforeUnload(): void {
    void persistSenderDraft()
  }

  watch(refMessages, schedulePersist, {deep: true})

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('beforeunload', onBeforeUnload)
    persistDebounced.cancel()
    // 离开聊天页时刷盘；切房间由 loader 在换会话之前 persist
    void persistSenderDraft()
  })

  return {
    persistSenderDraft,
    hydrateSenderDraft,
    schedulePersist,
    clearPersistedDraft,
  }
}

export type ImDraftApi = ReturnType<typeof useImDraft>

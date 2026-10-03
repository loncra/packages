import {computed, type ComputedRef, type Ref} from 'vue'
import {App} from 'antdv-next'
import type {RestResult} from '@loncra/client/commons'
import {
  type BasicUserChatConversation,
  ChatMessageService,
  type UserChatConversationResponseBody,
} from '@loncra/client/message'
import type {ImEvent} from '@loncra/chat-core'
import {compareConversations} from '../_util/chatRules'

/**
 * 会话列表的状态与变更（IM 模块内）。
 *
 * 迁自宿主 `composables/message-server/chat/useChatConversations.ts`（157 行），**只保留列表本身**：
 * - 数据访问：**直接用** `@loncra/client/message` 的 `ChatMessageService`（不发新的一层）；
 * - 排序：**派生态现算**（`sorted`），不再维护第二份"有序副本"；
 * - 变更只改**实体这一份**（§1.6）⇒ 视图跟着变，不需要往别处同步；
 * - 对外只**抛领域事实**（`conversation.removed` 等），**不**做通知/跳转。
 *
 * ⚠️ 排序/角色判定**不在本文件**：已按 2026-10-03 用户拍定的 A+ 归到包内共用件
 * `_util/chatRules.ts`（`compareConversations` / `resolveRole`，两域共用这一份）—— 它们要读
 * client 的**枚举值**，进不了「只许 `import type` client」的 `chat-core`。
 */
export interface UseImConversationsOptions {
  conversations: Ref<UserChatConversationResponseBody[]>
  activeKey: Ref<string | undefined>
  emit(event: ImEvent): void
}

export function useImConversations(options: UseImConversationsOptions) {
  const {conversations, emit} = options

  /** 渲染用顺序（**派生态**：每次从实体算，不另存副本） */
  const sorted: ComputedRef<UserChatConversationResponseBody[]> = computed(() =>
    [...conversations.value].sort(compareConversations),
  )

  function findById(id: number | undefined): UserChatConversationResponseBody | undefined {
    return id == null ? undefined : conversations.value.find((c) => c.id === id)
  }

  function findByRoomId(roomId: number | undefined): UserChatConversationResponseBody | undefined {
    return roomId == null ? undefined : conversations.value.find((c) => c.room?.id === roomId)
  }

  /** 首屏 / 全量刷新（整体替换；缺省 `draft` 补空数组，保持与宿主一致） */
  async function load(): Promise<void> {
    const result = await ChatMessageService.my()
    setAll(result?.data ?? [])
  }

  function setAll(list: UserChatConversationResponseBody[]): void {
    for (const item of list) {
      if (!item.draft) {
        item.draft = []
      }
    }
    conversations.value = [...list]
  }

  /** 按 id upsert 并置顶，返回最终置顶的那条 */
  function upsertToTop(
    body: UserChatConversationResponseBody,
  ): UserChatConversationResponseBody {
    const target = findById(body.id) ?? body
    conversations.value = [target, ...conversations.value.filter((c) => c.id !== body.id)]
    return target
  }

  /** 按 `room.id` 找到会话并置顶（可先改属性），常用于新消息到达 */
  function moveToTopByRoomId(
    roomId: number | undefined,
    mutate?: (conversation: UserChatConversationResponseBody) => void,
  ): void {
    const found = findByRoomId(roomId)
    if (!found) {
      return
    }
    mutate?.(found)
    conversations.value = [found, ...conversations.value.filter((c) => c.room?.id !== roomId)]
  }

  /** 不存在时头插（socket 推来新会话时） */
  function unshiftIfAbsent(body: UserChatConversationResponseBody): void {
    if (conversations.value.some((c) => c.id === body.id)) {
      return
    }
    conversations.value.unshift(body)
  }

  /** 按 `room.id` 整条替换（socket 推来会话更新时），返回替换后的那条 */
  function replaceByRoomId(
    roomId: number,
    body: UserChatConversationResponseBody,
  ): UserChatConversationResponseBody | undefined {
    const index = conversations.value.findIndex((c) => c.room?.id === roomId)
    if (index < 0) {
      return undefined
    }
    conversations.value[index] = body
    return conversations.value[index]
  }

  /** 本地移除（服务端删除由"房间设置"那条路径负责；这里只处理列表） */
  function remove(id: number | undefined): void {
    if (id == null) {
      return
    }
    conversations.value = conversations.value.filter((c) => c.id !== id)
    if (String(options.activeKey.value) === String(id)) {
      options.activeKey.value = undefined
    }
    emit({type: 'conversation.removed', conversationId: id})
  }

  /** 局部同步置顶/免打扰（批量接口返回的轻量对象） */
  function patchFlags(items: Array<{id?: number; pinned?: unknown; muted?: unknown}>): void {
    for (const patch of items) {
      const target = findById(patch.id)
      if (!target) {
        continue
      }
      if (patch.pinned !== undefined) {
        target.pinned = patch.pinned as UserChatConversationResponseBody['pinned']
      }
      if (patch.muted !== undefined) {
        target.muted = patch.muted as UserChatConversationResponseBody['muted']
      }
    }
  }

  /**
   * 会话动作（迁自宿主 `composables/message-server/chat/useConversationActions.ts`）：
   * **只发请求 + 统一提示**，本地状态由调用方按返回结果应用（`patchFlags` / `remove`）—— 与宿主同分工。
   *
   * ⚠️ 宿主还会顺手写 `messageServerStore.setUserChatMutedValue(...)`（它的未读徽标读那个 store）；
   * 模块里**未读以会话实体为准**（Step 1 契约）⇒ 不写宿主 store。
   * ⚠️ 提示用**包内** `antdv-next` 的 `App.useApp().message`（2026-10-03 用户拍定：
   * 动作进模块、toast 用包内 message）。
   */
  const {message} = App.useApp()

  async function togglePinned(ids: number[]): Promise<BasicUserChatConversation[]> {
    const result: RestResult<BasicUserChatConversation[]> =
      await ChatMessageService.pinnedConversation(ids)
    return result.data ?? []
  }

  async function toggleMuted(ids: number[]): Promise<BasicUserChatConversation[]> {
    const result: RestResult<BasicUserChatConversation[]> =
      await ChatMessageService.mutedConversation(ids)
    return result.data ?? []
  }

  async function removeConversations(ids: number[]): Promise<boolean> {
    try {
      const result: RestResult<void> = await ChatMessageService.deleteConversation(ids)
      message.success(result.message)
      return true
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
      return false
    }
  }

  return {
    sorted,
    findById,
    findByRoomId,
    load,
    setAll,
    upsertToTop,
    moveToTopByRoomId,
    unshiftIfAbsent,
    replaceByRoomId,
    remove,
    patchFlags,
    togglePinned,
    toggleMuted,
    removeConversations,
  }
}

export type ImConversationsApi = ReturnType<typeof useImConversations>

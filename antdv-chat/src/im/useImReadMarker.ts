import {watch} from 'vue'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import type {UserChatMessageEntity, UserChatMessageResponseBody} from '@loncra/client/message'
import {ChatMessageService, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE} from '@loncra/client/message'
import type {ChatBubbleItem} from '@loncra/chat-core'
import type {ImRuntime} from './useImChatContext'

/**
 * 可见消息的**已读上报**（迁自宿主 `composables/message-server/chat/useChatReadMarker.ts`）。
 *
 * 三段：**可见未读 → 收进队列 → 批量提交**。两个集合的分工（照抄宿主，注释是它的原话）：
 * - `readingSet`：待提交的 id；
 * - `sentIds`：**已提交但本地 `readable` 还没被 socket 回包更新**的 id —— 拦住重复提交。
 *
 * 与宿主的差异只有两处，都是**结构性的**（行为一致）：
 * 1. "我是谁" 比 `port.getPrincipal()`（不再读宿主 `principalStore`）；
 * 2. 切会话的 `reset()` **挪进本 hook**（宿主是 `useChatBubbleList.ts:190-193` 里的一个 `watch`）；
 * 3. 提交成功后**不碰宿主 store**（宿主原话 `messageServerStore.fetchUnreadQuantity()`）⇒ 抛 `read.reported`。
 *
 * ⚠️ **台账（原样保留、未归一）**：`session.readableAnchorLoading` 在宿主里**只被置 true、从没复位**
 * （唯一写入点 `useChatMessageLoader.ts:175`）⇒ 跳过一次"最早未读"之后，后续 `histories` 一直带
 * `withoutReadableAnchor` ⇒ **新的未读锚点再也不会回来**（按钮不再出现）。归一 = 改行为（如"锚点页
 * 加载完就复位"或"锚点消息被读到时报废"）⇒ **待拍**；模块这边保留原状，只把这条记在这里。
 */
/**
 * `runtime` 必须由调用方传（本 hook 的调用方 `l-im` 自己 provide 的 runtime 自己 inject 不到，
 * 见 `useImMessageList` 的说明）。
 */
export function useImReadMarker(runtime: ImRuntime) {
  const {port, session, emit} = runtime

  const readingSet = new Set<number>()
  const sentIds = new Set<number>()
  let readProcessing = false

  /**
   * 这条消息**该不该**报已读：非系统消息、`readable === YES`、且**不是我发的**（比 `principal`）。
   *
   * ⚠️ 气泡列表在调 `markVisible` 前**必须先用它过滤**（宿主 `useChatBubbleList.ts:87-90` 就是如此）
   * —— 列表里还有"没有更多了"这类没有 `readable` 字段的合成项。
   */
  function isReadableMessage(
    message: UserChatMessageResponseBody | UserChatMessageEntity | undefined,
  ): boolean {
    if (!message || isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
      return false
    }
    // `readable` 只在 ResponseBody 上（`UserChatMessageEntity` 没有这个字段）⇒ 在**这一处**收窄
    const readable = (message as UserChatMessageResponseBody).readable
    return (
      readable !== undefined &&
      isEnumValue(readable, YES_OR_NO_TYPE.YES) &&
      message.principal !== port.getPrincipal()
    )
  }

  /**
   * 把一批**可见的可读消息**收进队列并触发提交（气泡列表滚动/渲染时调；**传进来的必须已过滤**）。
   *
   * 顺带报废"未读锚点"：收到的这批里有锚点那条 ⇒ `metadata.readableAnchorId` 删掉 ⇒
   * 宿主那个"跳到最早未读"按钮随之隐藏（宿主同款行为）。
   */
  function markVisible(items: ChatBubbleItem[]): void {
    if (items.length <= 0) {
      return
    }
    for (const item of items) {
      const data = item.data as UserChatMessageResponseBody | undefined
      if (!data) {
        continue
      }
      const id = Number(data.id)
      if (!sentIds.has(id)) {
        readingSet.add(id)
      }
      const metadata = session.value.dataSource.metadata
      if (metadata && Number(metadata.readableAnchorId) === id) {
        delete metadata.readableAnchorId
      }
    }
    void flushReadQueue()
  }

  /** 批量提交（`while`：`await` 期间新收进来的 id 由下一批带走 —— 与宿主一致） */
  async function flushReadQueue(): Promise<void> {
    if (readProcessing || readingSet.size === 0) {
      return
    }
    readProcessing = true
    try {
      while (readingSet.size > 0) {
        const batch = Array.from(readingSet)
        readingSet.clear()
        try {
          await ChatMessageService.readMessage(batch)
          batch.forEach((id) => sentIds.add(id))
          emit({type: 'read.reported', messageIds: batch})
        } catch (error) {
          console.error('标记已读失败:', error)
          // 丢弃本批：本地 `readable` 仍为未读，下次滚动会重新收集（避免服务端故障时无限重试）
          break
        }
      }
    } finally {
      readProcessing = false
    }
  }

  /** 清空两个集合（切会话必须做，否则会把上一个会话的 id 提交上去） */
  function reset(): void {
    readingSet.clear()
    sentIds.clear()
  }

  // 切会话 ⇒ 复位（宿主那处 `watch` 挪进来；行为一致）
  watch(() => session.value.conversationKey, () => reset())

  return {isReadableMessage, markVisible, reset}
}

export type ImReadMarkerApi = ReturnType<typeof useImReadMarker>

import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import {type ChatBubbleItem, toBubbleContent} from '@loncra/chat-core'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import {useImReadMarker} from './useImReadMarker'
import type {ImRuntime} from './useImChatContext'

/** 相邻消息间隔超过它才插时间分隔条（宿主 `useChatBubbleList.ts:28` 同名常量） */
const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000

/**
 * IM 气泡列表的**业务层**：时间分隔条 + 可见区 → 已读上报。
 *
 * 迁自宿主 `composables/message-server/chat/useChatBubbleList.ts`（208 行），**只保留 IM 自己那部分**：
 * - 滚动/分页/闪烁/回到底部 ⇒ `_util/useBubbleList`（容器内核，本文件不重复）；
 * - 气泡外观（role）⇒ `ChatView` 按包内 token 给（宿主的 `DEFAULT_BUBBLE_LIST_ROLE` 里是 Tailwind 类）；
 * - 气泡右键菜单（引用/撤回 + 倒计时）与"重编辑" ⇒ **要发送器**，属下一片（见 `ChatView` 台账）。
 *
 * ⚠️ 与宿主的差异（都是"宿主依赖换模块依赖"，行为不变）：
 * 1. 分隔条文案走 `runtime.formatRelativeTime`（模块不引 dayjs；2026-10-03 用户拍定方案 C）；
 * 2. 已读上报走 `useImReadMarker(runtime)`（比 `port.getPrincipal()`；切会话复位已在它内部）。
 */
export function useImBubbleList(runtime: ImRuntime) {
  const {session, formatRelativeTime} = runtime
  const readMarker = useImReadMarker(runtime)

  /** 消息时间（排序 + 分隔条共用；宿主 `getBubbleMessageTime`） */
  function timeOf(item: ChatBubbleItem): number {
    return (item.data as UserChatMessageResponseBody | undefined)?.creationTime ?? 0
  }

  /**
   * 渲染项（宿主 `buildBubbleListWithDividers`）：**按业务体排一次序、按业务体粒度插分隔条**，
   * 再用 `toBubbleContent` 把每条展开（system 消息会派生多条 ⇒ 逐条 push，分隔条仍只出一个）。
   */
  function buildItems(messages: ChatBubbleItem[]): BubbleItemType[] {
    const sorted = [...messages]
      .filter((item) => !item.hide)
      .sort((a, b) => timeOf(a) - timeOf(b))
    const result: BubbleItemType[] = []
    let lastDividerTime = 0
    for (const item of sorted) {
      const time = timeOf(item)
      if (time > 0 && (result.length === 0 || time - lastDividerTime >= TIME_DIVIDER_GAP_MS)) {
        result.push({
          key: `divider-${String(item.key)}-${time}`,
          role: 'divider',
          content: formatRelativeTime(time),
        })
        lastDividerTime = time
      }
      for (const entry of toBubbleContent(item)) {
        result.push({...item, ...entry} as BubbleItemType)
      }
    }
    return result
  }

  /**
   * 可见区变化（宿主 `onVisibleItems`）：**只在窗口可见且聚焦时**上报，且**必须先过滤** ——
   * 列表里还有"没有更多了"这类没有 `readable` 的合成项。
   */
  function onVisibleItems(items: ChatBubbleItem[]): void {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) {
      return
    }
    readMarker.markVisible(
      items.filter((item) =>
        readMarker.isReadableMessage(item.data as UserChatMessageResponseBody | undefined),
      ),
    )
  }

  return {session, buildItems, onVisibleItems, readMarker}
}

export type ImBubbleListApi = ReturnType<typeof useImBubbleList>

import {computed, type MaybeRefOrGetter, nextTick, onUnmounted, ref, toValue, watch} from 'vue'
import type {BubbleListRef} from '@antdv-next/x/dist/bubble/interface'
import {throttle} from 'lodash-es'
import type {ActiveChatSession, ChatBubbleItem} from '@loncra/chat-core'
import {isNearNewest, isNearOldest, shouldShowScrollToBottom} from '@loncra/chat-core'
import type {BubbleListCallbacks, BubbleListProps} from '../bubble-list/types'

/**
 * 气泡列表内核：滚动分页、跳转闪烁、可见区探测。
 *
 * ⚠️ **本包不提供"默认 role / 外观"**（2026-10-01 修正）：默认 role 里是宿主的 Tailwind 类
 * （`bg-primary-bg!` 等），而 `packages/**` **不带 Tailwind** ⇒ 默认外观必须由**宿主**给
 * （宿主常量 `@/constants` 的 `DEFAULT_BUBBLE_LIST_ROLE`，或各域自己的 role 配置）。
 *
 * 从宿主 `composables/chat/useBubbleList.ts` 迁入（2026-10-01，S2a）：
 * - **纯算术**（触顶/触底/回到底部的阈值判定）已抽进 `@loncra/chat-core` 的 `paging.ts`，这里只调用；
 * - 其余（`throttle` / `nextTick` / `getBoundingClientRect` / 读 `ax-bubble-list` 的 DOM 与实例 API）留在这里；
 * - 泛型 `I`：让宿主/域传自己的条目类型（A1 之前宿主 item 还多一个 `content`）。
 *
 * 直接消费 `ActiveChatSession`；条目由 `callbacks.renderItem` 负责产出（如 IM 带时间分隔的列表）。
 */
export function useBubbleList<I extends ChatBubbleItem = ChatBubbleItem>(
  session: MaybeRefOrGetter<ActiveChatSession<I>>,
  listProps: MaybeRefOrGetter<BubbleListProps>,
  callbacks: BubbleListCallbacks<I>,
) {
  const showScrollToBottom = ref(false)
  const bubbleListRef = ref<BubbleListRef>()

  function getProps(): BubbleListProps {
    return toValue(listProps)
  }

  function getSession(): ActiveChatSession<I> {
    return toValue(session)
  }

  function getItems(): I[] {
    return getSession().dataSource.elements ?? []
  }

  function hasOlder(): boolean {
    return !getSession().dataSource.last
  }

  function hasNewer(): boolean {
    return !getSession().dataSource.first
  }

  const bubbleListItems = computed(() => callbacks.renderItem(getItems()))

  const handleThrottleBubbleScroll = throttle(
    throttleBubbleScroll,
    getProps().throttleOnScrollWait,
    {
      leading: true,
      trailing: true,
    },
  )

  const handleCollectVisible = throttle(emitVisibleItems, getProps().throttleCollectVisibleWait)

  function jumpToBottom(type: 'reloadLastPage' | 'bottom' = 'bottom'): void {
    if (type === 'bottom') {
      bubbleListRef.value?.scrollTo({top: 'bottom'})
      return
    }
    callbacks.onReloadLastPage?.()
  }

  function jumpToMessage(
    key: string,
    flashPending: boolean = true,
    block: ScrollLogicalPosition = 'nearest',
    behavior: ScrollBehavior = 'auto',
  ): void {
    if (!bubbleListRef.value || !key) {
      return
    }
    const sourceItems = getItems()
    const index = sourceItems.findIndex((b) => String(b.key) === String(key))
    if (index < 0) {
      return
    }
    const bubble = sourceItems[index]
    if (!bubble) {
      return
    }
    bubble.flashPending = flashPending
    bubbleListRef.value?.scrollTo({key: key, behavior: behavior, block: block})
    if (!flashPending) {
      return
    }
    nextTick(() => tryFlashPendingItems(bubbleListRef.value?.scrollBoxNativeElement))
  }

  function throttleBubbleScroll(event: Event): void {
    const current = getSession()
    if (current.loading) {
      return
    }
    const scrollBox = event.target as HTMLElement
    if (callbacks.onVisibleItems) {
      handleCollectVisible(scrollBox)
    }
    if (hasOlder() && isNearOldest(scrollBox, getProps().topThreshold)) {
      callbacks.onLoadPage('next', scrollBox)
    } else if (hasNewer() && isNearNewest(scrollBox, getProps().topThreshold)) {
      callbacks.onLoadPage('previous', scrollBox)
    }
  }

  function emitVisibleItems(scrollBox: HTMLElement): void {
    if (!callbacks.onVisibleItems) {
      return
    }
    callbacks.onVisibleItems(getVisibleItems(scrollBox), scrollBox)
  }

  function onBubbleScroll(event: Event): void {
    const scrollBox = event.target as HTMLElement
    showScrollToBottom.value = shouldShowScrollToBottom(
      scrollBox.scrollTop,
      getProps().scrollToBottomThreshold,
    )
    tryFlashPendingItems(scrollBox)
    handleThrottleBubbleScroll(event)
  }

  function getVisibleItems(
    scrollBox: HTMLElement,
    filter?: (item: I) => boolean | undefined,
  ): I[] {
    const scrollRect = scrollBox.getBoundingClientRect()
    const content = scrollBox.querySelector('.antd-bubble-list-scroll-content')
    if (!content) {
      return []
    }
    const visible: I[] = []
    const children = content.children
    for (let i = 0; i < children.length && i < bubbleListItems.value.length; i++) {
      const item = bubbleListItems.value[i]
      if (!item || item.role === 'divider') {
        continue
      }
      const bubble = item as unknown as I
      if (filter && !filter(bubble)) {
        continue
      }
      const element = children[i] as HTMLElement
      const rect = element.getBoundingClientRect()
      if (rect.bottom > scrollRect.top && rect.top < scrollRect.bottom) {
        visible.push(bubble)
      }
    }
    return visible
  }

  function tryFlashPendingItems(scrollBox: HTMLElement | undefined): void {
    if (!scrollBox) {
      return
    }
    const pending = getVisibleItems(scrollBox, (item) => item.flashPending === true)
    for (const visibleItem of pending) {
      const bubble = getItems().find((b) => String(b.key) === String(visibleItem.key))
      if (!bubble) {
        continue
      }
      nextTick(() => setTimeout(() => (bubble.flashPending = false), 2000))
      break
    }
  }

  function tryEmitVisibleItems(): void {
    if (!callbacks.onVisibleItems) {
      return
    }
    const scrollBox = bubbleListRef.value?.scrollBoxNativeElement
    if (scrollBox) {
      handleCollectVisible(scrollBox)
    }
  }

  if (callbacks.onVisibleItems) {
    watch(bubbleListItems, async (list) => {
      if (list.length === 0) {
        return
      }
      await nextTick()
      tryEmitVisibleItems()
    })

    window.addEventListener('focus', tryEmitVisibleItems)
    document.addEventListener('visibilitychange', tryEmitVisibleItems)
  }

  onUnmounted(() => {
    handleCollectVisible.cancel()
    handleThrottleBubbleScroll.cancel()
    if (callbacks.onVisibleItems) {
      window.removeEventListener('focus', tryEmitVisibleItems)
      document.removeEventListener('visibilitychange', tryEmitVisibleItems)
    }
  })

  function getScrollBox(): HTMLElement | undefined {
    return bubbleListRef.value?.scrollBoxNativeElement
  }

  function scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void {
    bubbleListRef.value?.scrollTo(options)
  }

  return {
    bubbleListRef,
    bubbleListItems,
    showScrollToBottom,
    onBubbleScroll,
    jumpToBottom,
    jumpToMessage,
    getVisibleItems,
    getScrollBox,
    scrollTo,
  }
}

export type BubbleListApi<I extends ChatBubbleItem = ChatBubbleItem> = ReturnType<
  typeof useBubbleList<I>
>

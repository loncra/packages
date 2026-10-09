import {computed, type MaybeRefOrGetter, nextTick, onUnmounted, ref, toValue, watch} from 'vue'
import type {BubbleItemType, BubbleListRef, RoleType} from '@antdv-next/x/dist/bubble/interface'
import {bubbleListContent} from '@loncra/chat-core'
import {BUBBLE_LIST_PREFIX} from './style/index.ts'
import type {
  BubbleListCallbacks,
  BubbleListItem,
  BubbleListProps,
  BubbleSession,
} from './types.ts'

function throttle<T extends (...args: never[]) => void>(fn: T, wait: number) {
  let timer: ReturnType<typeof setTimeout> | undefined
  let last = 0
  let latest: Parameters<T> | undefined
  const run = (args: Parameters<T>) => {
    last = Date.now()
    fn(...args)
  }
  const throttled = (...args: Parameters<T>) => {
    latest = args
    const remaining = wait - (Date.now() - last)
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }
      run(args)
      return
    }
    if (!timer) {
      timer = setTimeout(() => {
        timer = undefined
        if (latest) {
          run(latest)
        }
      }, remaining)
    }
  }
  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = undefined
    latest = undefined
  }
  return throttled
}

/**
 * 只留下 ax-bubble 会读的字段。
 * 消息 id、Agent status 与组件自己的 id、status 重名，不能摊到这一层。
 * 业务字段留在气泡上，插槽按渲染下标取回。
 * 进行中的加载由调用方的 isLoading 判断，这里不认识 Agent 状态码。
 */
export function toAxBubbleItem<T extends BubbleListItem>(
  item: T,
  extra?: Partial<BubbleItemType>,
  isLoading?: (item: T) => boolean,
): BubbleItemType {
  const content = bubbleListContent(item)
  const empty = typeof content === 'string' ? content.length === 0 : content.length === 0
  const loading = Boolean(item.loading || extra?.loading || (empty && isLoading?.(item)))
  return {
    ...extra,
    key: item.key,
    role: item.role,
    content,
    ...(loading ? {loading: true} : {}),
  }
}

export const DEFAULT_BUBBLE_LIST_ROLE = {
  user: {
    variant: 'filled',
    placement: 'end',
    shape: 'corner',
    classes: {content: `${BUBBLE_LIST_PREFIX}-user`},
  },
  ai: {
    variant: 'filled',
    placement: 'start',
    shape: 'corner',
  },
  system: {
    variant: 'outlined',
    shape: 'round',
    classes: {content: `${BUBBLE_LIST_PREFIX}-system`},
  },
  divider: {
    dividerProps: {
      plain: true,
      dashed: true,
      size: 'small',
      classes: {
        content: `${BUBBLE_LIST_PREFIX}-divider`,
        root: `${BUBBLE_LIST_PREFIX}-divider-root`,
      },
    },
  },
} as RoleType

/**
 * 无业务气泡列表：滚动分页、跳转闪烁、可见区探测。
 */
export function useBubbleList<T extends BubbleListItem>(
  session: MaybeRefOrGetter<BubbleSession<T>>,
  listProps: MaybeRefOrGetter<BubbleListProps>,
  callbacks: BubbleListCallbacks<T>,
  isLoading?: MaybeRefOrGetter<((item: T) => boolean) | undefined>,
) {
  const showScrollToBottom = ref(false)
  const bubbleListRef = ref<BubbleListRef>()

  function getProps(): BubbleListProps {
    return toValue(listProps)
  }

  function getSession(): BubbleSession<T> {
    return toValue(session)
  }

  function getItems(): T[] {
    return getSession().dataSource.elements ?? []
  }

  function hasOlder(): boolean {
    return !getSession().dataSource.last
  }

  function hasNewer(): boolean {
    return !getSession().dataSource.first
  }

  const rows = computed(() => callbacks.renderItem(getItems()))
  const domainItems = computed(() => rows.value.map((row) => row.bubble))
  const bubbleListItems = computed(() => rows.value.map((row) => {
    const flash = row.bubble.flashPending ? `${BUBBLE_LIST_PREFIX}-flash` : undefined
    const rootClass = [row.rootClass, flash].filter(Boolean).join(' ')
    return toAxBubbleItem(
      row.bubble,
      rootClass ? {rootClass} : undefined,
      toValue(isLoading),
    )
  }))

  const handleThrottleBubbleScroll = throttle(
    throttleBubbleScroll,
    getProps().throttleOnScrollWait,
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
    const scrollBox = scrollBoxOf(event)
    if (callbacks.onVisibleItems) {
      handleCollectVisible(scrollBox)
    }
    if (hasOlder() && isNearOldest(scrollBox)) {
      callbacks.onLoadPage('next', scrollBox)
    } else if (hasNewer() && isNearNewest(scrollBox)) {
      callbacks.onLoadPage('previous', scrollBox)
    }
  }

  /** 到最旧、最新两端的距离。column-reverse 时 0 贴着最新消息，离开后 scrollTop 可能为负或为正。 */
  function distanceToEnds(scrollBox: HTMLElement): {oldest: number; newest: number} {
    const max = Math.max(0, scrollBox.scrollHeight - scrollBox.clientHeight)
    const reverse = getComputedStyle(scrollBox).flexDirection === 'column-reverse'
    if (!reverse) {
      return {oldest: scrollBox.scrollTop, newest: max - scrollBox.scrollTop}
    }
    const fromNewest = Math.abs(scrollBox.scrollTop)
    return {oldest: Math.max(0, max - fromNewest), newest: fromNewest}
  }

  function isNearOldest(scrollBox: HTMLElement): boolean {
    return distanceToEnds(scrollBox).oldest <= getProps().topThreshold
  }

  function isNearNewest(scrollBox: HTMLElement): boolean {
    return distanceToEnds(scrollBox).newest <= getProps().topThreshold
  }

  function scrollBoxOf(event: Event): HTMLElement {
    return (event.currentTarget ?? event.target) as HTMLElement
  }

  function emitVisibleItems(scrollBox: HTMLElement): void {
    if (!callbacks.onVisibleItems) {
      return
    }
    callbacks.onVisibleItems(getVisibleItems(scrollBox), scrollBox)
  }

  function onBubbleScroll(event: Event): void {
    const scrollBox = scrollBoxOf(event)
    showScrollToBottom.value = distanceToEnds(scrollBox).newest > getProps().scrollToBottomThreshold
    tryFlashPendingItems(scrollBox)
    handleThrottleBubbleScroll(event)
  }

  function getVisibleItems(
    scrollBox: HTMLElement,
    filter?: (item: T) => boolean | undefined,
  ): T[] {
    const scrollRect = scrollBox.getBoundingClientRect()
    const content = scrollBox.querySelector('.antd-bubble-list-scroll-content')
    if (!content) {
      return []
    }
    const visible: T[] = []
    const children = content.children
    for (let i = 0; i < children.length && i < domainItems.value.length; i++) {
      const bubble = domainItems.value[i]
      if (!bubble || bubble.role === 'divider') {
        continue
      }
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
    domainItems,
    bubbleListRole: DEFAULT_BUBBLE_LIST_ROLE,
    showScrollToBottom,
    onBubbleScroll,
    jumpToBottom,
    jumpToMessage,
    getVisibleItems,
    getScrollBox,
    scrollTo,
  }
}

export type BubbleListApi<T extends BubbleListItem = BubbleListItem> = ReturnType<typeof useBubbleList<T>>

/**
 * 历史分页里两边相同的数组变换。
 * 来源：useChatMessageLoader.ts、useAgentMessageLoader.ts 的 loadPage / loadMore / jumpToAnchorPage。
 * 请求、角色、插到头还是尾仍由调用方决定。
 */
import type {PageResult} from '@loncra/client/commons'
import type {ChatBubbleItem} from './session.ts'
import type {TextBlock} from './content.ts'

export type PageDirection = 'next' | 'previous'

type PageEdges = {
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: {first: boolean; last: boolean}
}

/** 这一方向的端页已经到了，就不要再请求。 */
export function canLoadHistory(session: PageEdges, tag: PageDirection): boolean {
  if (tag === 'next') {
    return !(session.isOnLastPage || session.dataSource.last)
  }
  return !(session.isOnFirstPage || session.dataSource.first)
}

/** 与原先的 ++ / -- 相同：先改当前页码，请求失败也保留这个值。 */
export function stepPageNumber(current: number, tag: PageDirection): number {
  return tag === 'next' ? current + 1 : current - 1
}

/**
 * 用新的一页替换分页元数据。clear 时丢掉已有气泡，否则留下。
 * 这一页的消息由调用方再写入。
 */
export function applyHistoryPage<TBubble>(
  session: {
    isOnFirstPage?: boolean
    isOnLastPage?: boolean
    dataSource: PageResult<TBubble>
  },
  page: PageResult<unknown>,
  clear: boolean,
): void {
  const retained = clear ? [] : session.dataSource.elements
  session.dataSource = {
    ...session.dataSource,
    ...page,
    elements: retained,
  }
  if (clear) {
    session.isOnFirstPage = page.first
    session.isOnLastPage = page.last
  } else {
    if (page.first) {
      session.isOnFirstPage = true
    }
    if (page.last) {
      session.isOnLastPage = true
    }
  }
}

/** 向更新的一页翻到 last 时，把「没有更多」插到列表头。 */
export function prependNoMoreIfLast<T>(
  session: {isOnLastPage?: boolean; dataSource: {last: boolean; elements: T[]}},
  tag: PageDirection,
  noMore: T,
): void {
  if (tag === 'next' && session.dataSource.last) {
    session.dataSource.elements.unshift(noMore)
    session.isOnLastPage = true
  }
}

/**
 * 翻页前列表两端的那条，用来翻完后滚回去。
 * previous 取最新的一条，next 取最旧的一条。
 */
export function pageEdgeBubble<T extends {creationTime?: number}>(
  bubbles: readonly T[],
  tag: PageDirection,
): T | undefined {
  if (bubbles.length === 0) {
    return undefined
  }
  return bubbles.reduce((current, item) => {
    const keepCurrent = tag === 'previous'
      ? (current.creationTime ?? 0) >= (item.creationTime ?? 0)
      : (current.creationTime ?? 0) <= (item.creationTime ?? 0)
    return keepCurrent ? current : item
  })
}

/** 跳到锚点页之前，两端锁都放开，由随后那一页重新写上。 */
export function openPageEdges(session: {isOnFirstPage?: boolean; isOnLastPage?: boolean}): void {
  session.isOnFirstPage = false
  session.isOnLastPage = false
}

/**
 * 在已加载的气泡里找锚点。找不到就用第一条的 key。
 * hint 有值时插在锚点前面。
 */
export function locateAnchor<T extends ChatBubbleItem<TextBlock<string, unknown>>>(
  elements: T[],
  messageId: number,
  hint?: T,
): string | number | undefined {
  if (elements.length === 0) {
    return undefined
  }
  const anchorIndex = elements.findIndex((item) => item.key === String(messageId))
  if (anchorIndex < 0) {
    return elements.at(0)?.key
  }
  const anchor = elements[anchorIndex]
  if (hint && anchor) {
    elements.splice(anchorIndex, 0, hint)
  }
  return anchor?.key
}

import type {ChatRole, PageDirection, TextBlock} from '@loncra/chat-core'

export interface BubbleListItem {
  key: string | number
  role: ChatRole
  content: readonly TextBlock<string, unknown>[]
  hide?: boolean
  flashPending?: boolean
  loading?: boolean
  creationTime?: number
}

export interface BubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  throttleCollectVisibleWait: number
  topThreshold: number
}

export interface BubbleRenderRow<T extends BubbleListItem = BubbleListItem> {
  bubble: T
  rootClass?: string
}

export interface BubbleListCallbacks<T extends BubbleListItem = BubbleListItem> {
  onLoadPage: (tag: PageDirection, scrollBox: HTMLElement) => void
  onReloadLastPage?: () => void
  onVisibleItems?: (items: T[], scrollBox: HTMLElement) => void
  renderItem: (items: T[]) => BubbleRenderRow<T>[]
}

export interface BubbleListExpose {
  getScrollBox: () => HTMLElement | undefined
  getVisibleItems: (
    scrollBox: HTMLElement,
    filter?: (item: BubbleListItem) => boolean | undefined,
  ) => BubbleListItem[]
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => void
  jumpToBottom: (type?: 'reloadLastPage' | 'bottom') => void
  scrollTo: (options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }) => void
}

export interface BubbleSession<T extends BubbleListItem = BubbleListItem> {
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: {
    elements: T[]
    first: boolean
    last: boolean
  }
}

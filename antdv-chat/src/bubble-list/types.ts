/**
 * 气泡列表控件的入参。会话业务字段留在调用方的气泡上。
 * 来源：vue-basic-admin BubbleList.vue、useBubbleList.ts。
 */
import type {ChatRole, PageDirection, TextBlock} from '@loncra/chat-core'

/** 列表滚动只依赖这些字段。IM / Agent 的业务字段可以多出来。 */
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
  /** 可见区回调节流；仅当提供 onVisibleItems 时生效 */
  throttleCollectVisibleWait: number
  topThreshold: number
}

/** 渲染行。bubble 是列表里的那条；rootClass 只给 ax-bubble 的外层。 */
export interface BubbleRenderRow<T extends BubbleListItem = BubbleListItem> {
  bubble: T
  rootClass?: string
}

export interface BubbleListCallbacks<T extends BubbleListItem = BubbleListItem> {
  onLoadPage: (tag: PageDirection, scrollBox: HTMLElement) => void
  onReloadLastPage?: () => void
  /**
   * 可选。传入时注册：滚动节流 / items watch / focus / visibilitychange。
   * 参数为当前视口内全部非 divider 气泡，业务方自行过滤。
   */
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

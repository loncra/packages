import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import type {ChatBubbleItem} from '@loncra/chat-core'

/**
 * 气泡容器的滚动/分页参数（原宿主 `types/composables/chat.ts:116-122`）。
 * 归**容器主体**（`bubble-list/`），宿主改为从本包再导出（名字不变 ⇒ 调用点零改动）。
 */
export interface BubbleListProps {
  scrollToBottomThreshold: number
  throttleOnScrollWait: number
  /** 可见区回调节流；仅当提供 onVisibleItems 时生效 */
  throttleCollectVisibleWait: number
  topThreshold: number
}

/**
 * 容器回调。
 *
 * ⚠️ **一律写成"方法签名"而不是属性箭头函数** —— 这是让宿主能传"更窄条目类型"的关键：
 * 方法参数是**双变**的（`bivariant`），宿主传 `(items: 自己的条目[]) => …` 才过得去；
 * 写成 `renderItem: (items: I[]) => …` 则会按**逆变**检查 ⇒ 宿主必报错
 * （宿主 item 在 A1 之前比规范的 `ChatBubbleItem` 多一个 `content`）。
 *
 * 泛型 `I` 默认 = 规范的 `ChatBubbleItem`；宿主/域可传自己的条目类型。
 */
export interface BubbleListCallbacks<I extends ChatBubbleItem = ChatBubbleItem> {
  onLoadPage(tag: 'next' | 'previous', scrollBox: HTMLElement): void
  onReloadLastPage?(): void
  /**
   * 可选。传入时注册：滚动节流 / items watch / focus / visibilitychange。
   * 参数为当前视口内全部非 divider 气泡，业务方自行过滤。
   */
  onVisibleItems?(items: I[], scrollBox: HTMLElement): void
  renderItem(items: I[]): BubbleItemType[]
}

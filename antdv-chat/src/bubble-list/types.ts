import type {CSSProperties} from 'vue'
import type {BubbleItemType} from '@antdv-next/x/dist/bubble/interface'
import type {ChatBubbleItem} from '@loncra/chat-core'

/**
 * 本容器**自己渲染**的语义节点（`x` 的 `ListSemanticType` 管它内部；这里管"壳"）。
 *
 * 用途：宿主按语义**覆盖或扩展**默认样式（包只出默认，不封死）。
 * 默认样式见 `./style/index.ts`；某个语义没覆盖就用包的默认。
 *
 * - `root`：外壳（Flex，承载 hashId）—— 结构：撑满 / 相对定位 / overflow hidden
 * - `list`：`ax-bubble-list` 根（结构：flex + 高度）
 * - `scroll`：滚动区（默认左右 `paddingXS`）—— 会传给 x 的 `classes.scroll`
 * - `scrollToBottom`：回到底部的容器（绝对定位 + 居中 + 弹跳）
 * - `scrollToBottomButton`：该按钮（默认 `boxShadowCard`）
 */
export type BubbleListSemanticName =
  | 'root'
  | 'list'
  | 'scroll'
  | 'scrollToBottom'
  | 'scrollToBottomButton'

/** 语义覆盖：`classNames` 加类（叠加在默认类之后 ⇒ 你写的优先）；`styles` 加内联样式（同优先级靠后者胜）。 */
export interface BubbleListSemanticProps {
  classNames?: Partial<Record<BubbleListSemanticName, string>>
  styles?: Partial<Record<BubbleListSemanticName, CSSProperties>>
}

/**
 * 容器对宿主暴露的实例 API。
 *
 * ⚠️ 宿主 `ref` **用这个类型**，不要 `InstanceType<typeof BubbleList>`：
 * `setup()` + `expose()` 的自动推导在 vue-tsc 里不稳（实测 `TS2339`：暴露的方法不在实例类型上）。
 */
export interface BubbleListExpose {
  getScrollBox(): HTMLElement | undefined
  getVisibleItems(
    scrollBox: HTMLElement,
    filter?: (item: ChatBubbleItem) => boolean | undefined,
  ): ChatBubbleItem[]
  jumpToMessage(
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ): void
  jumpToBottom(type?: 'reloadLastPage' | 'bottom'): void
  scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void
}

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

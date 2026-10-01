/**
 * 分页 / 滚动的**纯算术**（从宿主 `composables/chat/useBubbleList.ts` 抽出：`:135-143`、`:155`）。
 *
 * 为什么抽出来：那几段只吃**数值**（`scrollTop` / `scrollHeight` / `clientHeight` / 阈值），
 * 与 Vue、DOM 元素、`ax-bubble-list` 的实例 API 全都无关 ⇒ 属规范（core-types §1.10）。
 * `useBubbleList` 里剩下的（`nextTick` / `throttle` / `getBoundingClientRect` / 查 ax-bubble 的 DOM）
 * 留实现层。
 *
 * ⚠️ 刻意**没有**搬 `hasOlder()` / `hasNewer()`（它们只是 `!dataSource.last` / `!dataSource.first`）——
 * 一行取值不值得多一层间接（YAGNI）。
 */

/** 滚动容器的三个度量（DOM 的 `scrollTop` / `scrollHeight` / `clientHeight`，但这里只当数字用） */
export interface ScrollMetrics {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}

/**
 * 是否滚到"更早的一头"（触顶）⇒ 可加载上一页。
 * 原式：`scrollBox.scrollHeight + scrollBox.scrollTop <= scrollBox.clientHeight + threshold`
 */
export function isNearOldest(
  {scrollTop, scrollHeight, clientHeight}: ScrollMetrics,
  threshold: number,
): boolean {
  return scrollHeight + scrollTop <= clientHeight + threshold
}

/**
 * 是否滚到"更新的一头"（触底）⇒ 可加载下一页。
 * 原式：`scrollBox.scrollTop >= -threshold`（该容器 scrollTop 为负是正常态）
 */
export function isNearNewest({scrollTop}: Pick<ScrollMetrics, 'scrollTop'>, threshold: number): boolean {
  return scrollTop >= -threshold
}

/**
 * 是否该显示"回到底部"按钮。
 * 原式：`showScrollToBottom.value = scrollBox.scrollTop <= -threshold`
 */
export function shouldShowScrollToBottom(scrollTop: number, threshold: number): boolean {
  return scrollTop <= -threshold
}

/**
 * 气泡容器（`ax-bubble-list` 的外壳）。IM 与 Agent **共用这一份**（2026-10-01 S2a-3 从宿主迁入）。
 *
 * - 组件：`BubbleList`（默认样式在 `./style/index.ts`，token 化；宿主用语义 `classNames`/`styles` 覆盖）
 * - 内核：`../_util/useBubbleList`（滚动/分页/可见区/跳转闪烁）
 * - 契约：`./types`（`BubbleListProps` / `BubbleListCallbacks` / 语义名）
 */
export {BubbleList} from './BubbleList'
export type {BubbleListInstance} from './BubbleList'
export type {
  BubbleListCallbacks,
  BubbleListExpose,
  BubbleListProps,
  BubbleListSemanticName,
  BubbleListSemanticProps,
} from './types'

export { default as EmojiButton } from './emoji-button'
export type { EmojiButtonEmits, EmojiButtonProps, EmojiButtonSlots } from './emoji-button'

export { default as InstructionSender } from './instruction-sender'
export type {
  InstructionItem,
  InstructionMeasure,
  InstructionPopoverState,
  InstructionSenderApi,
  InstructionSenderEmits,
  InstructionSenderExpose,
  InstructionSenderHandle,
  InstructionSenderProps,
  InstructionSenderSlots,
  UseInstructionSenderParams,
} from './instruction-sender'
export { useInstructionSender } from './instruction-sender'

export { default as Markdown, MarkdownCodeRenderer } from './markdown'
export type {
  MarkdownCodeRendererProps,
  MarkdownProps,
  MarkdownSlots,
  MarkdownTheme,
} from './markdown'

// ── 气泡容器（2026-10-01 S2a 从宿主迁入：内核 → 组件）
//    ⚠️ **不含默认外观**（`DEFAULT_BUBBLE_LIST_ROLE` 是宿主的 Tailwind 定制 ⇒ 留宿主 `@/constants`）；
//    容器自己的结构/默认样式在 `bubble-list/style`（token 化），宿主可用语义 `classNames`/`styles` 覆盖。
export { useBubbleList } from './_util/useBubbleList'
export type { BubbleListApi } from './_util/useBubbleList'

// ── 消息列表的分页/锚点/合入（2026-10-01 S2b-1 从宿主两个 loader 抽出）
//    ⚠️ 抽的是"骨架"，**两域差异走 `ChatMessageListAdapter` 回调**（含 2 处疑似 Agent 侧 bug，
//    原样保留、未归一）—— 详见该文件头部与各成员注释。
export { useChatMessageList } from './_util/useChatMessageList'
export type {
  ChatMessageListAdapter,
  ChatMessageListApi,
  ChatMessagePageLoad,
  ChatMessagePageTag,
} from './_util/useChatMessageList'
export { BubbleList } from './bubble-list'
export type { BubbleListInstance } from './bubble-list'
export type {
  BubbleListCallbacks,
  BubbleListExpose,
  BubbleListProps,
  BubbleListSemanticName,
  BubbleListSemanticProps,
} from './bubble-list'

// ── 草稿（本机持久化：Dexie 库 + 仓库 + 槽转换；2026-10-01 S2a-B 从宿主迁入）
//    ⚠️ 契约在 `@loncra/chat-core`（`DraftRecordBase` / `DraftCodec` / `Persistable*`）；
//    **域记录与 codec 仍住宿主**（S3/S4 随域迁入）⇒ 本层只认基座，`getDraft<TR>()` 由调用方给出记录类型。
export { DraftDatabase, draftDatabase } from './_util/draft'
export {
  DraftBlobTooLargeError,
  clearDraft,
  clearPrincipal,
  getDraft,
  putDraft,
} from './_util/draft'
export {
  collectBlobsFromSlotConfig,
  persistableToSlotConfig,
  slotConfigToPersistable,
} from './_util/draft'
export type { RestoreDraftSlotFactories, RestoreInstructionBlock } from './_util/draft'

// ── 发送器外壳件（2026-10-01 S2a-4 从宿主迁入）
export { SenderSlotBubbleContent } from './sender-shell'
export type { SlotBubbleBlock } from './sender-shell'

export { default as zhCN } from './locale/zh_CN'
export { default as enUS } from './locale/en_US'
export type { Locale } from './locale'

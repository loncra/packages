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

// ── 气泡容器内核（2026-10-01 S2a 从宿主迁入）
//    宿主暂时从这里 import；S2a-4 把 `BubbleList` 组件也搬进来后，这些可以收成"内部件"（仅包内用）
//    ⚠️ **不含默认外观**（`DEFAULT_BUBBLE_LIST_ROLE` 是宿主的 Tailwind 定制 ⇒ 留宿主 `@/constants`）
export { useBubbleList } from './_util/useBubbleList'
export type { BubbleListApi } from './_util/useBubbleList'
export type { BubbleListCallbacks, BubbleListProps } from './bubble-list/types'

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

export { default as zhCN } from './locale/zh_CN'
export { default as enUS } from './locale/en_US'
export type { Locale } from './locale'

/**
 * `@loncra/chat-core` —— **聊天规范**（形状 + 纯判定 + 纯变换）。
 *
 * 硬纪律：本包**永不许**出现 `vue` / `@antdv-next/x` / `antdv-next` / pinia / vue-router / vue-i18n /
 * `@/`（宿主）/ `import.meta.env`；只许 `import type` `@loncra/client`（**零运行期依赖**）。
 * 校验脚本：`.codebuddy/check-chat-core-discipline.cjs`。
 *
 * 实现标准在 `@loncra/antdv-chat`（Vue）；依赖方向单向：`antdv-chat` → 本包。
 */
export type {ChatRole} from './role'
export {CHAT_ROLE} from './role'

export type {ChatBlockBase, CustomChatBlock, TextBlock} from './block'

export type {ChatBubbleItem, ChatMessageBase} from './message'

// A1（2026-10-01 S2b-2）：`content` 移出条目、渲染时现算。`toBubbleContent` 是**唯一**的派生口。
export type {ChatBubbleContentEntry} from './bubble'
export {addBubbleListMessage, toBubbleContent} from './bubble'

export type {
  ActiveChatSession,
  ChatConversationBase,
  ChatViewControllerBase,
} from './conversation'

export type {
  DraftBlobRow,
  DraftCodec,
  DraftRecordBase,
  PersistableSlot,
  PersistableUploadFile,
} from './draft'
export {draftBlobId, draftRecordId} from './draft'

export type {InstructionSlotProps} from './slot'
export {isInstructionSlot} from './slot'

export type {ScrollMetrics} from './paging'
export {isNearNewest, isNearOldest, shouldShowScrollToBottom} from './paging'

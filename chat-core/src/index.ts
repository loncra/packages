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
// `ChatBubbleRenderItem` 是两域同形的**渲染项**类型（2026-10-03 从 IM 侧上提，宿主 Agent 侧一直同义）。
export type {ChatBubbleContentEntry, ChatBubbleRenderItem} from './bubble'
export {addBubbleListMessage, toBubbleContent} from './bubble'

export type {
  ActiveChatSession,
  ChatConversationBase,
  ChatViewControllerBase,
} from './conversation'
// 两域共用的**空页 / 空会话**（2026-10-03：从 IM 侧上提 —— Agent 复位列表时用的是同一套口径）
export {createEmptyPage, createEmptySession, DEFAULT_PAGE_SIZE} from './conversation'

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

// ── IM 模块的"标准"（2026-10-03 Step 1：模块 ↔ 宿主的全部约定，纯类型）
//    ⚠️ 只有"包自己拿不到、又只能由宿主给"的（socket 订阅 / "我是谁"）才在这里；
//    未读用实体 `readableCount`，外观走插槽，路由/通知/图标走事件或宿主自己。
export type {ImEvent, ImHostPort, ImSocketHandlers} from './im'

export type {ScrollMetrics} from './paging'
export {isNearNewest, isNearOldest, shouldShowScrollToBottom} from './paging'

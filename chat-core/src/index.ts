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

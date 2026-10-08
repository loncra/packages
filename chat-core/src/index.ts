/**
 * 聊天内核。
 *
 * content.ts：词槽基类 TextBlock、自定义槽 CustomBlock、两边都有的附件和点名。
 * im.ts：引用、撤回、通话、IM 草稿。
 * agent.ts：思考、工具、回答、错误、Agent 草稿。
 * session.ts：气泡与会话。TBlock 约束为 TextBlock。
 * page.ts：历史分页的合并、端页判断、锚点定位。
 * draft.ts：两边共用的草稿信封。
 *
 * 不在包内：Vue、Pinia、路由、i18n、Dexie、antdv-next、气泡列表 DOM 回调、
 * ImHost / AgentHost、角色判定、时间分隔、通话媒体、Hub。
 */
import type {AgentDraftRecord} from './agent.ts'
import type {ImDraftRecord} from './im.ts'

export type {
  AttachmentBlock,
  CustomBlock,
  InstructionBlock,
  SharedContentBlock,
  TextBlock,
} from './content.ts'

export type {
  CallBlock,
  ImBubbleBody,
  ImChatBubble,
  ImContentBlock,
  ImCustomBlock,
  ImDraftRecord,
  ReferenceBlock,
  UndoBlock,
} from './im.ts'

export type {
  AgentAnswerBlock,
  AgentBubbleBody,
  AgentChatBubble,
  AgentContentBlock,
  AgentDeltaBlock,
  AgentDraftRecord,
  AgentErrorBlock,
  AgentThinkBlock,
  AgentToolCallBlock,
} from './agent.ts'

export {appendMessages, bubbleListContent, textBubble} from './session.ts'
export {
  applyHistoryPage,
  canLoadHistory,
  locateAnchor,
  openPageEdges,
  pageEdgeBubble,
  prependNoMoreIfLast,
  stepPageNumber,
} from './page.ts'
export type {PageDirection} from './page.ts'
export type {
  ActiveChatSession,
  ChatBubbleBody,
  ChatBubbleItem,
  ChatRole,
} from './session.ts'

export type DraftRecord = ImDraftRecord | AgentDraftRecord
export type DraftScope = DraftRecord['scope']

export {draftBlobId, draftRecordId} from './draft.ts'
export type {
  DraftBlobRow,
  DraftCodec,
  DraftRecordBase,
  PersistableSlot,
  PersistableUploadFile,
} from './draft.ts'

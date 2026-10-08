/**
 * IM 词槽。引用、撤回、通话没有发送器芯片的 id，所以不继承 CustomBlock，只继承 TextBlock。
 * 来源：vue-basic-admin/src/types/composables/chat.ts 的 ReferenceBlock、UndoBlock、CallBlock。
 */
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {UserChatMessageResponseBody} from '@loncra/client/message'
import type {TextBlock, SharedContentBlock} from './content.ts'
import type {ChatBubbleBody, ChatBubbleItem} from './session.ts'
import type {DraftRecordBase} from './draft.ts'

/** IM 自定义词槽。与 CustomBlock 的差别是没有 id。 */
export interface ImCustomBlock<TSlotKind extends string, TValue = string>
  extends TextBlock<'custom', TValue> {
  slotKind: TSlotKind
}

/** 来源：chat.ts ReferenceBlock。value 用 @loncra/client/message 的响应体，不依赖管理端 @/types。 */
export interface ReferenceBlock
  extends ImCustomBlock<'reference', UserChatMessageResponseBody[]> {}

/** 来源：chat.ts UndoBlock */
export interface UndoBlock extends ImCustomBlock<'undo'> {
  tooltip?: string
}

/** 来源：chat.ts CallBlock。value 是通话取值枚举，同名字段来自 TextBlock。 */
export interface CallBlock extends ImCustomBlock<'call', NameValueEnumMetadata<number>> {
  userChatCallId: number
  caller: string
  scene: NameValueEnumMetadata<number>
  status: NameValueEnumMetadata<number>
}

export type ImContentBlock = SharedContentBlock | ReferenceBlock | UndoBlock | CallBlock

/** 约束：IM 气泡 content 的每一块都是 TextBlock。 */
export type ImBubbleBody = ChatBubbleBody<ImContentBlock>

/**
 * IM 气泡。业务字段来自消息响应体（principal、已读、参与者、撤回）。
 * 列表项上的 key / role 来自 ChatBubbleItem。
 */
export interface ImChatBubble
  extends Omit<UserChatMessageResponseBody, 'content'>,
    ChatBubbleItem<ImContentBlock> {}

/**
 * 来源：draft.ts ImDraftRecord。
 * 引用条只挂在这条草稿上。refMessages 与 ReferenceBlock.value 同一消息类型。
 */
export interface ImDraftRecord extends DraftRecordBase {
  scope: 'im'
  id: string
  refMessages: UserChatMessageResponseBody[]
}

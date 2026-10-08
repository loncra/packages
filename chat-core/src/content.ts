/**
 * 词槽。气泡 content 里每一块都从 TextBlock 长出来。
 *
 * 来源：vue-basic-admin/src/types/composables/chat.ts 的 TextBlock、AttachmentBlock、InstructionBlock。
 * 后两个原先各自写了 type / id / slotKind。这里收成 CustomBlock，子类只写自己的载荷。
 *
 * type 做成类型参数：子接口要把 type 写成 'custom'。字面量 'text' 不能被直接覆盖成 'custom'。
 * IM 的引用 / 撤回 / 通话在 im.ts，Agent 的思考 / 工具 / 回答 / 错误在 agent.ts。
 */
import type {IdValueMetadata, ObjectWriteResult} from '@loncra/client/commons'

/** 来源：chat.ts TextBlock。纯文本是默认参数 TextBlock<'text', string>。 */
export interface TextBlock<TType extends string = 'text', TValue = string> {
  type: TType
  value: TValue
}

/**
 * 自定义词槽。继承 TextBlock，type 固定为 custom，并多出 id、slotKind。
 * 来源：chat.ts AttachmentBlock 与 InstructionBlock 的公共字段。
 */
export interface CustomBlock<TSlotKind extends string, TValue = string>
  extends TextBlock<'custom', TValue> {
  id: string
  slotKind: TSlotKind
}

/**
 * 来源：chat.ts AttachmentBlock。
 * 已上传结果放在 value，不再另写 files。
 */
export interface AttachmentBlock extends CustomBlock<'files', ObjectWriteResult[]> {}

/**
 * 来源：chat.ts InstructionBlock。
 * value 收窄为点名 id/value。prefix 是这一支多出来的字段。
 */
export interface InstructionBlock
  extends CustomBlock<'instruction', IdValueMetadata<string, string>> {
  prefix: string
}

/** IM 与 Agent 都能出现的词槽。 */
export type SharedContentBlock = TextBlock | AttachmentBlock | InstructionBlock

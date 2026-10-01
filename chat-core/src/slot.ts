import type {IdValueMetadata} from '@loncra/client/commons'

/**
 * 指令槽的**值形状**（信封层）：规范只认形状，**不认识渲染**（芯片长什么样、带什么 metadata 是宿主的事）。
 * 从宿主 `types/composables/chat.ts:78-82` 的 `InstructionSlotProps` 迁来（同一件事，不再两个名字）。
 */
export interface InstructionSlotProps {
  slotKind: 'instruction'
  defaultValue: IdValueMetadata<string, string>
  prefix: string
}

/**
 * 指令芯片判定。
 *
 * 提交组装（`useChatMessageSender` / `useAgentSender`）与草稿持久化（`persistableSlots`）**共用这一份**，
 * 别各写一遍。原来是宿主 `utils/chatUtils.ts:288-296`（纯 `typeof` 判定 ⇒ 属规范）。
 *
 * 谓词额外带上 `key?: string`：消费方紧接着会读 `slot.key`（如 `isInstructionSlot(slot) && slot.key`）。
 */
export function isInstructionSlot(
  slot: unknown,
): slot is {type: 'custom'; key?: string; props: InstructionSlotProps} {
  if (!slot || typeof slot !== 'object') {
    return false
  }
  const value = slot as {type?: string; props?: {slotKind?: unknown}}
  return value.type === 'custom' && value.props?.slotKind === 'instruction'
}

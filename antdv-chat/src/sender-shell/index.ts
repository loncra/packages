/**
 * 发送器外壳相关件（2026-10-01 S2a-4 从宿主迁入）。
 *
 * ⚠️ 设计稿里这一目录还提过 `ChatSenderShell`（"指令槽 + 附件 + emoji + 域内容插槽"的外壳）——
 * **宿主里并不存在这个组件**（两个发送器 `ChatMessageSender` / `AgentSender` 各自成套）
 * ⇒ **不凭空造**：等两个发送器真正合并（S2b/S3/S4）时再抽，那时它天然是"搬运"而不是"新写"。
 */
export {SenderSlotBubbleContent} from './SenderSlotBubbleContent'
export type {SlotBubbleBlock} from './SenderSlotBubbleContent'

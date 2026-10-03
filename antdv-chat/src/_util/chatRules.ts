import {isEnumValue, type NameValueEnumMetadata, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE, type UserChatConversationResponseBody,} from '@loncra/client/message'
import {CHAT_ROLE, type ChatRole} from '@loncra/chat-core'

/**
 * 消息 / 会话的**纯判定**（IM、Agent 两域共用这一份；2026-10-03 用户拍定 A+）。
 *
 * ⚠️ **为什么放实现包的 `_util`、不放 `@loncra/chat-core`**：这些判定要读 client 的**枚举值**
 * （`isEnumValue` / `MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE` / `YES_OR_NO_TYPE`），而 core
 * 只许 `import type` client（纪律脚本第 ② 条）⇒ 塞进 core 就只能把"这条是不是系统消息"当
 * 布尔**从调用方传进来**，判定函数被迫长成多参形状（调用点读不懂它到底在判什么）⇒ 归包内更划算。
 */

/**
 * 这条消息的气泡挂哪一侧。
 *
 * 1. 类型是 `SYSTEM(20)` ⇒ 居中（系统提示）；
 * 2. 否则看发送者：`principal === self` ⇒ 靠右（`USER`）、其他人 ⇒ 靠左（`AI`）。
 *    （`CALL(30)` 同样走第 2 条 —— 与宿主现状一致。）
 *
 * ⚠️ 判据用 `principal`，**不是** `participant.metadata.details.systemName`：`UserChatMessageEntity`
 * 上**没有 `participant`**（只有 `principal`），而 socket 那条路收到的正可能是 entity
 * ⇒ 只有 `principal` 在两种数据形状上都存在，这是"两份合成一份"的前提。
 *
 * @param message 消息（只用到 `type` / `principal` 两个字段）
 * @param self    当前用户（= `principalStore.state.name`）
 */
export function resolveRole(
  message: {type: NameValueEnumMetadata<number> | number; principal: string},
  self: string,
): ChatRole {
  if (isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
    return CHAT_ROLE.SYSTEM
  }
  return message.principal === self ? CHAT_ROLE.USER : CHAT_ROLE.AI
}

/** 会话活跃时间（置顶排序用）：最后一条消息 > 会话创建时间 */
function activeTime(item: UserChatConversationResponseBody): number {
  return item.lastUserMessage?.creationTime ?? item.creationTime ?? 0
}

/** 会话列表顺序：置顶优先 → 置顶内按 `pinnedTime` 降序 → 其余按活跃时间降序 */
export function compareConversations(
  a: UserChatConversationResponseBody,
  b: UserChatConversationResponseBody,
): number {
  const aPinned = isEnumValue(a.pinned, YES_OR_NO_TYPE.YES)
  const bPinned = isEnumValue(b.pinned, YES_OR_NO_TYPE.YES)
  if (aPinned !== bPinned) {
    return aPinned ? -1 : 1
  }
  if (aPinned && bPinned) {
    return (b.pinnedTime ?? 0) - (a.pinnedTime ?? 0)
  }
  return activeTime(b) - activeTime(a)
}

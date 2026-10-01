import type {PageResult, VersionEntityMetadata} from '@loncra/client/commons'
import type {ChatBubbleItem} from './message'

/** 会话实体（两侧共同的最小形状）—— 域的 `ImConversation` / `AgentConversation` 都 `extends` 它 */
export interface ChatConversationBase extends VersionEntityMetadata {
  name?: string
  principal?: string
  status?: unknown
  metadata?: Record<string, unknown>
}

/**
 * **活跃会话的"运行时容器"**（⚠️ **不是会话实体**，也**不该继承** `ChatConversationBase`）。
 *
 * 两侧共用的是这个**基类**，域各自 `extends` 加东西（IM `UserChatConversationActiveProps`、
 * Agent `ActiveAgentConversationItem`）⇒ **不是"两侧逐字相同"**。
 *
 * 为什么只有这几个字段：共享代码只读这几个 —— `useBubbleList.ts:120-121` 读 `loading`、
 * `:128-131` 决定翻页，`dataSource` 就是消息列表；**会话实体字段（`name` / `principal` / `status` …）
 * 容器一个都不读** ⇒ 不进这里。域要实体就**持有引用**（IM：`item` → `item.data` 才是实体），
 * **不要 `{...conversation}` 展开副本**（Agent 现状是展开，会要求"手动同步三处"）。
 */
export interface ActiveChatSession {
  /**
   * 当前会话身份（**中性表达**；共享 loader 用它判断"是不是同一个会话"、写回旧草稿）。
   *
   * 现状两域写法不一致 —— IM 用 `active.item?.key`（`useChatMessageLoader.ts:108-115`）、
   * Agent 用平铺的 `active.id`（`useAgentContext.ts:88`）；统一成这个字段。
   *
   * ⚠️ **可选**（2026-10-01 T3 实测改判）：Agent **新建中的会话 `id` 是 `undefined`**
   * （`useAgentContext.ts:113`：`Type 'number | undefined' is not assignable to 'string | number'`）
   * ⇒ 必填只能靠哨兵值（`''`）撒谎；可选 + "**共享 loader 必须判空**"才是诚实形状。
   * 约定：**有值 = 已绑定会话；`undefined` = 尚未绑定**（如新建中），此时不该写草稿。
   */
  conversationKey?: string | number
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: PageResult<ChatBubbleItem>
}

/**
 * 视图控制器（两侧同形；Agent 多一个 `getScrollBox`）。
 * ⚠️ `ScrollLogicalPosition` / `ScrollBehavior` 是 **web 平台类型**（`lib.dom`），不是框架类型 ⇒ 规范可用。
 */
export interface ChatViewControllerBase {
  jumpToMessage(
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ): void
  scrollTo(options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }): void
  getSenderSlotConfigValue(): unknown[]
  persistSenderDraft(): Promise<void>
  hydrateSenderDraft(): Promise<void>
}

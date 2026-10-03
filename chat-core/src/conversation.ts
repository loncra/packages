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
export interface ActiveChatSession<I extends ChatBubbleItem = ChatBubbleItem> {
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
  /**
   * 消息列表。泛型 `I` 让**实现层**能把条目收窄成自己的形状（宿主 item 在 A1 之前还多一个 `content`）
   * —— 默认 `ChatBubbleItem` ⇒ 不传参数时行为与从前一致（T3 的宿主用法不变）。
   */
  dataSource: PageResult<I>
}

/** 一页的默认大小（与宿主 `DEFAULT_PAGE_RESULT_VALUE.size` 同口径） */
export const DEFAULT_PAGE_SIZE = 10

/**
 * **空页 / 兜底页**（两域共用：IM 拿不到数据时兜底，Agent 复位列表时用它起头）。
 *
 * `first` / `last` 皆 true ⇒ 两端都锁住，不显示任何"可加载"信号。
 * `metadata: {}` 是**照抄宿主**的（拿不到数据时把旧的列表元数据一起清掉 —— IM 的未读锚点就挂在里面）。
 */
export function createEmptyPage<I extends ChatBubbleItem = ChatBubbleItem>(
  size: number = DEFAULT_PAGE_SIZE,
): PageResult<I> {
  return {elements: [], first: true, last: true, number: 1, size, metadata: {}}
}

/**
 * **空会话容器**（两域共用）。
 *
 * 域自己 `extends ActiveChatSession` 加运行态（IM：`participants` / `readableAnchorLoading`）
 * ⇒ 这里的返回类型是基座，域那份是**结构上兼容**的扩展（可选字段）。
 */
export function createEmptySession<I extends ChatBubbleItem = ChatBubbleItem>(
  size: number = DEFAULT_PAGE_SIZE,
): ActiveChatSession<I> {
  return {
    conversationKey: undefined,
    loading: false,
    isOnFirstPage: true,
    isOnLastPage: true,
    dataSource: createEmptyPage<I>(size),
  }
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

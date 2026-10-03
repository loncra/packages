import type {
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody,
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
} from '@loncra/client/message'

/**
 * IM 模块的**标准**：模块 ↔ 宿主之间的**全部约定**（纯类型；无运行期）。
 *
 * ⚠️ **只有"包自己拿不到、又只能由宿主给"的东西能进这里**：
 * - `subscribe`：socket 建连与鉴权在宿主；
 * - `getPrincipal`：**我是谁**（宿主登录态）—— 用来判"这条消息是不是我发的"。
 *
 * **不在这里**（判据：这件事是不是"聊天"本身？见模块设计 §二越权清单）：
 * - 未读数 ⇒ 用会话实体自带的 `readableCount`（`messageServerStore` 那套是"整体维度统计"，属外层菜单/角标）；
 * - 一切**渲染/外观** ⇒ `l-im` 的**插槽**（`@loncra/antdv-chat` 的 `ImSlots`）；
 * - 路由 / 系统通知 / 图标字体 / 主题 / 环境配置 / 弹窗挂载点 ⇒ 走**事件**或宿主自己；
 * - 数据访问 ⇒ 包**直接用** `@loncra/client` 的 SDK（它本就是 peer；不为"看起来像规范"再造一层）。
 */

/**
 * 服务端推送的载荷 —— **逐条镜像宿主现有的真实订阅**（2026-10-03 按实测补齐并拆开）。
 *
 * 模块只声明"我要听这几类"，**谁喂、怎么连**由宿主实现（`ImHostPort.subscribe`）。
 *
 * ⚠️ 这几条不是"设计得好看"，而是**宿主订阅的镜像**（每条都标了证据行号）。之所以要拆开：
 * 原先写成 `onConversation(payload: unknown)` / `onRead(payload: unknown)` / `onUndo(payload: unknown)`
 * —— **那种签名没法实现**：① 三个会话事件载荷不同（整条 / roomId / 无）、处理也不同；
 * ② 已读回执与消息更新在宿主走**同一个**处理器；③ 通话三个载荷是具体实体不是未知。
 */
export interface ImSocketHandlers {
  /** 新消息：`CHAT_MESSAGE`（宿主 `useChatSocketEvents.ts:115`） */
  onMessage(payload: UserChatMessageResponseBody): void
  /**
   * 一条消息**已存在**的消息有变：`CHAT_MESSAGE_READ`（已读回执）+ `CHAT_MESSAGE_UPDATE`
   * —— 宿主把这两个事件接到**同一个**处理器（`ChatView.vue:265/274`）。
   */
  onMessageUpdated(payload: UserChatMessageResponseBody | UserChatMessageEntity): void
  /** 消息撤回：`CHAT_MESSAGE_UNDO`（宿主 `ChatView.vue:269`） */
  onMessageUndone(payload: UserChatMessageEntity): void
  /** 新会话（整条）：`CHAT_CONVERSATION_CREATE`（宿主 `useChatSocketEvents.ts:118`） */
  onConversationCreated(payload: UserChatConversationResponseBody): void
  /** 某房间的会话有变，**载荷是 roomId** ⇒ 模块自己去拉最新（宿主 `useChatSocketEvents.ts:121`） */
  onConversationRefreshByRoomId(payload: number): void
  /** 会话列表**全量刷新**（无载荷；宿主 `useChatSocketEvents.ts:124`） */
  onConversationRefresh(): void
  /** 通话：参与者状态（宿主 `useChatCallModal.ts:316`） */
  onCallParticipantUpdate(payload: UserChatCallParticipantEntity): void
  /** 通话：结束（宿主 `useChatCallModal.ts:321`） */
  onCallCompleted(payload: UserChatCallEntity): void
  /** 通话：更新（宿主 `useChatCallModal.ts:326`） */
  onCallUpdate(payload: UserChatCallEntity): void
}

/** 宿主给模块的能力（**由宿主实现**；作为 `l-im` 的 `port` prop 传入） */
export interface ImHostPort {
  /** 订阅服务端推送；返回取消订阅 */
  subscribe(handlers: ImSocketHandlers): () => void
  /**
   * "我是谁" —— 与消息体的 `principal`（client `UserChatMessageEntity.principal: string`）直接比较即可判
   * "这条是我发的吗"（**不要再比 `participant.metadata.details.systemName` 或显示名**：那是脆弱且有歧义的写法）。
   */
  getPrincipal(): string
}

/**
 * 模块抛给宿主的**领域事实**（`l-im` 的 `@message` 事件，单一出口）。
 *
 * 宿主拿到后**想干嘛就干嘛**：系统通知、路由跳转、声音、埋点、更新外层卡片的 extra 内容……
 * ⇒ 模块因此**不需要**认识 router / 通知库 / icon-font（这是"扩展性"的来源）。
 */
export type ImEvent =
  | {type: 'message.received'; message: UserChatMessageResponseBody}
  | {type: 'message.updated'; message: UserChatMessageResponseBody}
  | {type: 'message.removed'; messageId: number}
  | {type: 'conversation.activated'; conversation: UserChatConversationResponseBody; messageId?: number}
  | {type: 'conversation.removed'; conversationId: number}
  | {type: 'unread.changed'; conversationId: number; count: number}
  /**
   * 已读上报**成功**（宿主照旧要做的是 `messageServerStore.fetchUnreadQuantity()` —— 刷**外层**徽标）。
   * ⚠️ 不复用 `unread.changed`：那个要 `count`，而此刻模块**不知道**新数字（那是宿主 store 的维度）。
   */
  | {type: 'read.reported'; messageIds: number[]}
  | {type: 'call.invited' | 'call.connected' | 'call.ended'; call: UserChatCallResponseBody}
  | {type: 'send.failed'; error: unknown}

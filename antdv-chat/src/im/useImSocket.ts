import {onScopeDispose} from 'vue'
import {isEnumValue, type RestResult} from '@loncra/client/commons'
import type {UserChatConversationEntity, UserChatConversationResponseBody,} from '@loncra/client/message'
import {ChatMessageService, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE} from '@loncra/client/message'
import type {ImRuntime} from './useImChatContext'
import type {ImConversationsApi} from './useImConversations'
import type {ImMessageListApi} from './useImMessageList'

/**
 * IM 的 **socket 接线**：宿主推来的事件 → ① 模块内**一次状态变更** ② 一条**领域事实**（`ImEvent`）。
 *
 * 迁自宿主**散在三处**的订阅（2026-10-03）：
 * - `useChatSocketEvents.ts`：新消息 / 新建会话 / 按房间刷新 / 全量刷新；
 * - `ChatView.vue:265-277`：已读回执 / 撤回 / 消息更新（原先挂在页面组件里）；
 * - 通话三个（`useChatCallModal.ts:316-328`）**留到 Step 4**（`im/call/**`），这里先是占位。
 *
 * 三条纪律：
 * 1. **消息只从 `list.mergeMessage` 进列表**（分页与 socket 同一个入口）；
 * 2. **只改实体这一份**：会话相关一律改 `conversations`（列表），头部/左侧/未读**都是它的派生态**
 *    —— 宿主当年还要 `refreshActiveHeader` / 重新指向 `active.item`，那些在模块里**自然消失**；
 * 3. **宿主要知道的事只走 `emit`**（通知 / 角标 / 埋点由宿主决定）。
 *
 * ⚠️ 只在 `l-im` 的 setup 里调用（`port.subscribe` 立刻订阅，随作用域销毁自动退订）。
 */
export interface UseImSocketOptions {
  /** 模块运行时（**必须由 `l-im` 传**：它自己 provide 的自己 inject 不到，见 `useImMessageList`） */
  runtime: ImRuntime
  /** 消息列表（`useImMessageList` 的返回值） */
  list: ImMessageListApi
  /** 会话列表（`useImConversations` 的返回值） */
  conversations: ImConversationsApi
}

export function useImSocket(options: UseImSocketOptions): void {
  const {runtime, list, conversations} = options
  const {port, session, activeConversation, emit, view} = runtime

  const unsubscribe = port.subscribe({
    /** 新消息（宿主 `useChatSocketEvents.ts:41-55`） */
    onMessage(message) {
      // 自己刚发的**普通消息**本地已经插过了 ⇒ socket 回包丢掉（宿主同款 guard，`:44`）
      if (
        message.principal === port.getPrincipal() &&
        isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.USER)
      ) {
        return
      }
      if (activeConversation.value?.room?.id === message.userChatRoomId && view.value) {
        // 非首页收到的新消息先藏着（与原实现一致）；头插（`append=false`）
        list.mergeMessage(message, false, !session.value.isOnFirstPage)
      }
      // 会话置顶 + 更新预览：**只改列表实体**
      conversations.moveToTopByRoomId(message.userChatRoomId, (conversation) => {
        conversation.lastUserMessage = message
      })
      emit({type: 'message.received', message})
    },

    /**
     * 已存在消息的内容有变：`CHAT_MESSAGE_READ`（已读回执）+ `CHAT_MESSAGE_UPDATE`
     * —— 宿主把这两个接到同一个处理器（`ChatView.vue:265/274`）⇒ 这里也是同一个。
     */
    onMessageUpdated(patch) {
      list.updateMessage(patch)
      // 不抛事件：宿主当年在这条路径上没有任何反应（回包只用于刷气泡）
    },

    /** 消息撤回（宿主 `ChatView.vue:269` + `useChatNotification.ts:165` 的未读刷新） */
    onMessageUndone(undo) {
      list.markUndone(undo)
      notifyUnread(undo.userChatRoomId)
    },

    /** 新会话（宿主 `useChatSocketEvents.ts:57-65`：`unshiftIfAbsent` + 外层未读数刷新） */
    onConversationCreated(conversation) {
      conversations.unshiftIfAbsent(conversation)
      // 实体 `id` 类型上可选；没有 id 就没法说"是哪个会话的未读变了" ⇒ 不抛
      if (conversation.id !== undefined) {
        emit({
          type: 'unread.changed',
          conversationId: conversation.id,
          count: conversation.readableCount,
        })
      }
    },

    /** 某房间的会话有变（宿主 `useChatSocketEvents.ts:67-99`）：**回源拉最新**再整条替换 */
    async onConversationRefreshByRoomId(roomId) {
      if (!conversations.findByRoomId(roomId)) {
        return
      }
      const result: RestResult<UserChatConversationEntity | UserChatConversationResponseBody> =
        await ChatMessageService.getConversation(roomId, true)
      if (!result.data) {
        return
      }
      // 换掉列表里那条 ⇒ 头部/左侧/未读全是派生态，**不需要**宿主当年那套 `refreshActiveHeader`
      conversations.replaceByRoomId(roomId, result.data as UserChatConversationResponseBody)
    },

    /** 会话列表全量刷新（宿主 `useChatSocketEvents.ts:101-113`） */
    async onConversationRefresh() {
      await conversations.load()
      // ⚠️ 宿主这里还调了 `activateConversation(find)` —— 那是它"手动把 active 指向新实体"的结果
      // （`useChatContext.ts:48-54` ⇒ `switchConversation` 同 key 分支）；模块的 `activeConversation`
      // 是**按 key 现算的派生态**，`load()` 之后它自己就指向新实体了 ⇒ **这里什么都不用做**。
    },

    // ── 通话（Step 4 `im/call/**` 接；现在宿主仍是 `useChatCallModal.ts` / `useChatCallMedia.ts` 自己订阅）
    onCallParticipantUpdate: () => {},
    onCallCompleted: () => {},
    onCallUpdate: () => {},
  })

  /** 撤回收到了 ⇒ 未读可能变了：把**该会话实体的当前未读数**抛给宿主（宿主当年是 `fetchUnreadQuantity()`） */
  function notifyUnread(roomId: number): void {
    const conversation = conversations.findByRoomId(roomId)
    if (conversation?.id !== undefined) {
      emit({
        type: 'unread.changed',
        conversationId: conversation.id,
        count: conversation.readableCount,
      })
    }
  }

  onScopeDispose(unsubscribe)
}

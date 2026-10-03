import {computed, nextTick} from 'vue'
import type {PageResult, RestResult} from '@loncra/client/commons'
import type {
  UserChatConversationResponseBody,
  UserChatMessageEntity,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
} from '@loncra/client/message'
import {ChatMessageService} from '@loncra/client/message'
import {
  addBubbleListMessage,
  CHAT_ROLE,
  type ChatBubbleItem,
  type ChatMessageBase,
  createEmptyPage,
  createEmptySession,
  type TextBlock,
} from '@loncra/chat-core'
import {resolveRole} from '../_util/chatRules'
import {useLocale} from '../_util/useLocale'
import {useChatMessageList} from '../_util/useChatMessageList'
import {type ImRuntime, type ImSession} from './useImChatContext'

/**
 * IM 的消息列表：**分页 / 锚点 / 合入**（复用包内 `_util/useChatMessageList` 的骨架）
 * + IM 域自己的部分（角色判定、请求组装、房间参与者、切会话、未读锚点、历史跳转）。
 *
 * 迁自宿主 `composables/message-server/chat/useChatMessageLoader.ts`（S2b-1 之后留下的域部分）。
 *
 * 三条纪律（Step 2 的审查点）：
 * 1. **role 只用 `principal` 判** —— 走 `_util/chatRules.resolveRole`，不再比 `participant.details.systemName`；
 * 2. **消息入列表只有一个入口** —— `mergeMessage` → `addBubbleListMessage`（分页、socket 推送都必须走它）；
 * 3. **派生态不存副本** —— 房间 id / 会话实体都从 `activeConversation`（按 `activeKey` 算）取，
 *    `session` 里只有气泡列表与运行态标志。
 */

/** 列表元数据（IM 自有；后端 `histories` 随页带回来） */
interface ImListMetadata {
  /** 最早未读消息 id（宿主在 `#bubbleListAfter` 里据此显示"跳到未读"按钮） */
  readableAnchorId?: number
  /** 上面那条所在的页码（`toReadableAnchor` 用它定位） */
  readableAnchorPage?: number
}

/**
 * "没有更多了" / 未读锚点提示这类**合成项**挂的桩数据。
 *
 * 文本放进 `content` 块 ⇒ `toBubbleContent` 的 SYSTEM 分支把它取出来 ⇒ 渲染出来就是这句话
 * （A1 之后条目本身没有 `content`，合成项靠这个桩走同一条派生路径）。
 * `id: 0` 是个无意义的占位（键取自 `item.key`，`data.id` 用不到）；
 * **不填 `creationTime`** ⇒ `findAnchor` 里 `?? 0` ⇒ 与宿主原行为一致（锚点搜索永远排不到它）。
 */
function syntheticData(text: string, creationTime?: number): ChatMessageBase<TextBlock> {
  return {id: 0, content: [{type: 'text', value: text}], creationTime}
}

/** 秒级时间戳（合成项的 key；与宿主 `$dayjs().unix()` 同口径） */
function unixSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * IM 的消息列表（模块内部件）。
 *
 * ⚠️ **`runtime` 必须由调用方传进来**（不能在这里 `useImChat()`）：本 hook 的调用方是 `l-im`，
 * 而 `l-im` **自己 provide 的 runtime 自己 inject 不到**（Vue 的 `inject` 只看父链）
 * ⇒ 只有**子组件**里才能用 `useImChat()`。2026-10-03 实测踩过这个坑。
 */
export function useImMessageList(runtime: ImRuntime) {
  const {session, view, activeConversation, port, formatRelativeTime} = runtime
  const locale = useLocale('BubbleList')

  /** 房间 id（**从当前会话实体取**，不在 `session` 里存副本） */
  function currentRoomId(): number | undefined {
    return activeConversation.value?.room?.id
  }

  /** `dataSource.metadata` 是协议字段（`Record<string, unknown>`）⇒ 在**这一处**收窄成 IM 认识的形状 */
  function anchorMetadata(): ImListMetadata {
    return (session.value.dataSource.metadata ?? {}) as ImListMetadata
  }

  /**
   * 一条业务体**进列表** —— **唯一入口**（分页合入与 socket 推送都走它）。
   *
   * `append` = 插尾（"更早的一页"合入时用）；socket 的新消息用默认**头插** + `hide`。
   */
  function mergeMessage(
    message: UserChatMessageResponseBody,
    append: boolean = false,
    hide: boolean = false,
  ): void {
    addBubbleListMessage(
      message,
      resolveRole(message, port.getPrincipal()),
      session.value.dataSource.elements,
      append,
      hide,
    )
  }

  /** 按业务体主键找条目（主键写在 `data.id` 上；"没有更多了"那类合成项没有 `data`） */
  function findItem(id: number | undefined): ChatBubbleItem | undefined {
    return id === undefined
      ? undefined
      : session.value.dataSource.elements.find((item) => String(item.data?.id) === String(id))
  }

  const list = useChatMessageList<ImSession>({
    active: session,
    view,
    // 差异 ②：IM 拿不到数据时用**兜底空页**（`first`/`last` 都是 true ⇒ 直接锁住两端），不是"放弃本页"
    fetchPage: async (number, active) => {
      const roomId = currentRoomId()
      if (!roomId) {
        return createEmptyPage()
      }
      const result: RestResult<PageResult<UserChatMessageResponseBody>> =
        await ChatMessageService.histories(
          {number, withoutReadableAnchor: active.readableAnchorLoading},
          roomId,
        )
      return result?.data ?? createEmptyPage()
    },
    // 差异 ③：IM 传 `!prepend`（更早的页插头、更新的页插尾）⇒ 与 socket 走**同一个**入口
    mergeMessage: (body, _elements, prepend) => {
      mergeMessage(body as UserChatMessageResponseBody, !prepend)
    },
    fetchPageNumberOf: async (messageId, active) => {
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        Number(currentRoomId()),
        messageId,
        active.dataSource.size,
      )
      return result.data
    },
    // 差异 ④：房间 id 必须有效（Agent 那边看的是 `!active.loading`）
    canLoad: () => !!currentRoomId(),
    // 差异 ⑤：`'previous'`（更新的一页）插尾
    pageOptionsFor: (tag) => ({prepend: tag === 'previous'}),
    // 差异 ⑥：IM 有"实时锚点跳转"（Agent 侧那段被注释掉了）
    anchorJump: true,
    createNoMoreBubble: () => ({
      key: unixSeconds(),
      role: CHAT_ROLE.SYSTEM,
      data: syntheticData(locale.value.noMore),
    }),
    createAnchorBubble: (systemMessage, at) => ({
      key: 'system-anchor-message-' + unixSeconds(),
      role: CHAT_ROLE.SYSTEM,
      data: syntheticData(systemMessage, at),
    }),
  })

  /**
   * 就地更新一条**已存在**的消息（已读回执 / 消息更新）：**只改 `data`**，内容由 `toBubbleContent` 现算。
   *
   * ⚠️ `item.data` 在规范里是"只保证 `content`"的松类型，而这里装的其实是 client 的 IM 消息体
   * ⇒ 在**这一处**收窄（和 `mergeMessage` 同款边界；想彻底消灭这两个 cast，得把条目的 `data`
   * 按 client 消息类型参数化 —— 与 `ActiveChatSession` 那个 `I` 是同一件事，待定）。
   */
  function updateMessage(patch: UserChatMessageResponseBody | UserChatMessageEntity): void {
    const item = findItem(patch.id)
    if (!item?.data) {
      return
    }
    item.data = {...(item.data as UserChatMessageResponseBody), ...patch}
  }

  /**
   * 标记"已撤回"：写**事实**（`undo` / `undoTime` / `metadata.oldContent`）**并把 `content` 换成撤回块**
   * （宿主 `ChatView.vue:238-246` 同款，2026-10-03 补：原先只写事实 ⇒ 气泡永远不变、渲染侧的撤回块
   * 成了死代码）。
   *
   * 三处口径：
   * 1. 块的 `value` 写的是**别人看到的那句**（`BubbleList.undoMessageValue`）；"我撤回的"由渲染侧
   *    现换成 `ChatView.selfUndo` ⇒ 不写进 `value`；
   * 2. `tooltip` 里的**相对时间必须现算**（模块不引 dayjs）⇒ 在这里用 `formatRelativeTime` 算好塞进去
   *    （宿主也是把 `$dayjs().fromNow()` 的结果塞进去的）；
   * 3. 旧内容留在 `metadata.oldContent` ⇒ "重新编辑"要用（`useImSender.reedit`）。
   */
  function markUndone(undo: UserChatMessageEntity): void {
    const item = findItem(undo.id)
    if (!item?.data) {
      return
    }
    const data = item.data as UserChatMessageResponseBody
    const undoTime = Number(undo.undoTime ?? Date.now())
    // 先建成 client 类型（`metadata` / `undo` 不在规范的松信封上，字面量直接赋会被判多余属性）
    const patched: UserChatMessageResponseBody = {
      ...data,
      undo: undo.undo,
      undoTime: undo.undoTime,
      metadata: {...data.metadata, oldContent: data.content},
      content: [
        {
          type: 'custom',
          slotKind: 'undo',
          value: locale.value.undoMessageValue,
          tooltip: locale.value.undoTime.replace('{time}', `:${formatRelativeTime(undoTime)}`),
        },
      ],
    }
    item.data = patched
  }

  /**
   * 把当前输入框写回**当前会话实体**并落盘。
   *
   * ⚠️ 切走 / 取消激活**之前**必须做：先写回列表项（内存「[草稿]」读它），再 persist；
   * 且必须在换身份之前调用（否则会拿新房间 id 把旧稿写进 IDB —— 宿主注释里的原话）。
   */
  async function persistDraft(): Promise<void> {
    const conversation = activeConversation.value
    if (conversation && view.value) {
      conversation.draft = view.value.getSenderSlotConfigValue()
      await view.value.persistSenderDraft()
    }
  }

  /** 拉房间参与者（群聊气泡的"谁发的"、房间设置都要） */
  async function loadParticipant(roomId: number): Promise<void> {
    const result: RestResult<UserChatParticipantEntity[]> =
      await ChatMessageService.findRoomParticipant(roomId)
    if (result.data) {
      session.value.participants = result.data
    }
  }

  /**
   * 切到某个会话（`l-im` 在点会话 / `activeKey` 变化时调用）。
   *
   * 顺序照宿主：**先把旧会话草稿写回并落盘，再换身份、hydrate、拉参与者、加载** ——
   * 写回必须在换身份**之前**（否则会拿新房间 id 把旧稿写进 IDB）。
   *
   * ⚠️ 这里**不抛** `conversation.activated`：受控场景（宿主改 `activeKey`）会回声 ——
   * 由 `l-im` 决定在哪一层抛（Step 3）。
   */
  async function activate(
    conversation: UserChatConversationResponseBody,
    messageId?: number,
    reload: boolean = false,
  ): Promise<void> {
    if (session.value.loading) {
      return
    }
    const previous = activeConversation.value
    await persistDraft()
    const key = String(conversation.id)
    runtime.activeKey.value = key
    if (previous && String(previous.id) === key && !reload) {
      return
    }
    session.value = {
      ...createEmptySession(),
      conversationKey: conversation.id,
      isOnFirstPage: true,
      isOnLastPage: false,
      loading: true,
    }
    try {
      const roomId = conversation.room?.id
      if (!roomId) {
        return
      }
      await nextTick()
      await view.value?.hydrateSenderDraft()
      await loadParticipant(roomId)
      if (!messageId) {
        await list.loadPage(1, {clear: reload})
        await nextTick()
        view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } else {
        await list.positioningMessage(messageId)
      }
    } finally {
      session.value.loading = false
    }
  }

  /** 取消激活（会话被删 / `activeKey` 被清空）⇒ **先落草稿**再复位容器；由 `l-im` 调用 */
  async function deactivate(): Promise<void> {
    await persistDraft()
    session.value = createEmptySession()
  }

  /** 是否该显示"跳到最早未读"（宿主用它做按钮的 `v-if`；文案/外观都是宿主的） */
  const readableAnchorVisible = computed(
    () => !session.value.loading && !!anchorMetadata().readableAnchorId,
  )

  /** 跳到"最早未读消息"（宿主按钮触发，模块 expose） */
  async function toReadableAnchor(): Promise<void> {
    const {readableAnchorId, readableAnchorPage} = anchorMetadata()
    if (!activeConversation.value || !readableAnchorId || !readableAnchorPage) {
      return
    }
    /*
     * 期间请求不带未读锚点（否则这一页会带回同一个锚点）。
     * ⚠️ **台账（原样保留，未改）**：宿主里这个标志**只被置 true、从没复位**（唯一写入点就是这里）
     * ⇒ 跳过一次"最早未读"之后，后续 `histories` 一直带 `withoutReadableAnchor` ⇒ **新的未读锚点
     * 再也不会回来**（按钮不再出现）。归一 = 改行为（如"锚点页加载完就复位"）⇒ **待拍**，
     * 详见 `useImReadMarker` 头注。
     */
    session.value.readableAnchorLoading = true
    await list.jumpToAnchorPage(
      Number(readableAnchorId),
      Number(readableAnchorPage),
      locale.value.readableSystemMessage,
    )
  }

  /** 历史消息里点一条 ⇒ 跳到它（已在列表里就直接跳，否则问服务端在第几页） */
  async function jumpToHistoryMessage(message: UserChatMessageResponseBody): Promise<void> {
    if (!activeConversation.value) {
      return
    }
    const target = session.value.dataSource.elements.find(
      (item) => item.key === String(message.id),
    )
    if (target) {
      view.value?.jumpToMessage(String(target.key))
      return
    }
    await list.positioningMessage(Number(message.id))
  }

  return {
    loadPage: list.loadPage,
    loadMore: list.loadMore,
    jumpToAnchorPage: list.jumpToAnchorPage,
    positioningMessage: list.positioningMessage,
    mergeMessage,
    updateMessage,
    markUndone,
    activate,
    deactivate,
    loadParticipant,
    readableAnchorVisible,
    toReadableAnchor,
    jumpToHistoryMessage,
  }
}

export type ImMessageListApi = ReturnType<typeof useImMessageList>

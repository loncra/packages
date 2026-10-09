import {nextTick, type Ref} from 'vue'
import {revealAnchor} from '../../history/revealAnchor'
import type {PageRequest, PageResult, RestResult} from '@loncra/client/commons'
import {
  ChatMessageService,
  type UserChatMessageResponseBody,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import {
  appendMessages,
  applyHistoryPage,
  canLoadHistory,
  type ChatBubbleItem,
  type ChatRole,
  openPageEdges,
  pageEdgeBubble,
  prependNoMoreIfLast,
  stepPageNumber,
  type TextBlock,
  textBubble,
} from '@loncra/chat-core'

type HistoryBubble = ChatBubbleItem<TextBlock<string, unknown>>

export interface ImHistoryConversation {
  key: string
  data?: {
    room?: {id?: number}
  }
}

/** 活跃会话上历史加载会读写的那一段。管理端的会话对象比这多，能直接传进来。 */
export interface ImHistorySession<TBubble extends HistoryBubble = HistoryBubble> {
  loading: boolean
  drawerOpen: boolean
  readableAnchorLoading?: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  participants: UserChatParticipantEntity[]
  item?: ImHistoryConversation
  dataSource: PageResult<TBubble>
}

export interface ImHistoryHost {
  noMoreText: () => string
  nowUnix: () => number
  readableSystemMessage: () => string
  resolveRole: (message: UserChatMessageResponseBody) => ChatRole
  beforeSwitch: () => Promise<void>
  scrollToBottom: () => void
  jumpToMessage: (key: string, flashPending?: boolean, block?: ScrollLogicalPosition) => void
}

function emptyPage<TBubble>(): PageResult<TBubble> {
  return {
    elements: [],
    first: true,
    last: true,
    number: 1,
    size: 10,
    metadata: {},
  }
}

/**
 * IM 历史分页、锚点跳转、切换会话。
 * 文案、角色、滚到哪、切走前落草稿由 host 提供。
 */
export function useImHistory<TSession extends ImHistorySession>(
  session: Ref<TSession>,
  host: ImHistoryHost,
) {
  let pageLock = false

  function active(): ImHistorySession {
    return session.value
  }

  async function loadPage(
    chatRoomId: number,
    number: number,
    append: boolean = false,
    clear: boolean = false,
  ): Promise<void> {
    const current = active()
    if (pageLock) {
      return
    }
    const request: PageRequest = {
      number,
      withoutReadableAnchor: current.readableAnchorLoading,
    }
    try {
      pageLock = true
      const result: RestResult<PageResult<UserChatMessageResponseBody>> =
        await ChatMessageService.histories(request, chatRoomId)
      const page = result?.data || emptyPage<UserChatMessageResponseBody>()
      applyHistoryPage(current, page, clear)
      for (const message of page.elements || []) {
        // previous 插到头，next 追加到尾。loadMore 用 append=true 表示 previous。
        appendMessages(message, host.resolveRole(message), current.dataSource.elements, !append)
      }
    } finally {
      pageLock = false
    }
  }

  async function loadParticipant(roomId: number): Promise<void> {
    const result: RestResult<UserChatParticipantEntity[]> =
      await ChatMessageService.findRoomParticipant(roomId)
    if (result.data) {
      active().participants = result.data
    }
  }

  async function switchConversation(
    item: ImHistoryConversation,
    messageId?: number,
    reload: boolean = false,
  ): Promise<void> {
    const current = active()
    if (current.loading) {
      return
    }
    await host.beforeSwitch()
    if (current.item?.key === item.key && !reload) {
      current.item = {...current.item, ...item}
      return
    }
    current.loading = true
    current.drawerOpen = false
    try {
      current.item = item
      current.isOnFirstPage = true
      current.isOnLastPage = false
      current.dataSource = emptyPage()
      if (!current.item?.data?.room) {
        return
      }
      await loadParticipant(Number(current.item.data.room.id))
      if (!messageId) {
        await loadPage(Number(current.item.data.room.id), 1, false, reload)
        await nextTick()
        host.scrollToBottom()
      } else {
        await positioningMessage(messageId, Number(current.item.data.room.id))
      }
    } finally {
      current.loading = false
    }
  }

  async function loadMore(tag: 'next' | 'previous'): Promise<void> {
    await nextTick()
    const current = active()
    if (pageLock) {
      return
    }
    if (!canLoadHistory(current, tag)) {
      return
    }
    const roomId = Number(current.item?.data?.room?.id)
    if (!roomId) {
      return
    }
    const anchor = pageEdgeBubble(current.dataSource.elements, tag)
    current.dataSource.number = stepPageNumber(current.dataSource.number, tag)
    await loadPage(roomId, current.dataSource.number, tag === 'previous')
    await nextTick()
    if (anchor) {
      host.jumpToMessage(String(anchor.key), false, tag === 'next' ? 'nearest' : 'end')
    }
    prependNoMoreIfLast(
      current,
      tag,
      textBubble(host.nowUnix(), host.noMoreText()),
    )
  }

  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const current = active()
    openPageEdges(current)
    current.loading = true
    try {
      await loadPage(Number(current.item?.data?.room?.id), pageNumber, false, true)
      await revealAnchor(
        current.dataSource.elements,
        messageId,
        systemMessage,
        host.nowUnix(),
        (key) => host.jumpToMessage(key),
      )
    } finally {
      current.loading = false
    }
  }

  function showReadableAnchorButton(): boolean {
    const current = active()
    return !current.loading && !!current.dataSource?.metadata?.readableAnchorId
  }

  async function toReadableAnchor(): Promise<void> {
    const current = active()
    if (!current.item) {
      return
    }
    if (!current.dataSource?.metadata?.readableAnchorPage) {
      return
    }
    const readableAnchorId = current.dataSource.metadata.readableAnchorId
    if (!readableAnchorId) {
      return
    }
    current.readableAnchorLoading = true
    await jumpToAnchorPage(
      Number(readableAnchorId),
      Number(current.dataSource.metadata.readableAnchorPage),
      host.readableSystemMessage(),
    )
  }

  async function jumpToHistoryMessage(data: UserChatMessageResponseBody): Promise<void> {
    const current = active()
    if (!current.item) {
      return
    }
    current.drawerOpen = false
    await nextTick()
    const index = current.dataSource.elements.findIndex((item) => item.key === String(data.id))
    if (index >= 0) {
      const anchorBubble = current.dataSource.elements[index]
      if (!anchorBubble) {
        return
      }
      host.jumpToMessage(String(anchorBubble.key))
      return
    }
    await positioningMessage(Number(data.id), Number(current.item.data?.room?.id))
  }

  async function positioningMessage(messageId: number, roomId: number): Promise<void> {
    const current = active()
    if (!current.item) {
      return
    }
    try {
      current.loading = true
      const result: RestResult<number> = await ChatMessageService.positioningMessagePageNumber(
        roomId,
        messageId,
        current.dataSource.size,
      )
      if (result.data) {
        await jumpToAnchorPage(messageId, result.data)
      }
    } finally {
      current.loading = false
    }
  }

  return {
    loadPage,
    switchConversation,
    loadMore,
    jumpToAnchorPage,
    showReadableAnchorButton,
    loadParticipant,
    toReadableAnchor,
    jumpToHistoryMessage,
  }
}

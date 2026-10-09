import {nextTick, type Ref} from 'vue'
import {revealAnchor} from '../../history/revealAnchor'
import type {PageResult, RestResult} from '@loncra/client/commons'
import {AgentService, type AgentMessageEntity} from '@loncra/client/ai'
import {
  appendMessages,
  applyHistoryPage,
  canLoadHistory,
  type ChatBubbleItem,
  type ChatRole,
  openPageEdges,
  prependNoMoreIfLast,
  stepPageNumber,
  type TextBlock,
  textBubble,
} from '@loncra/chat-core'

type HistoryBubble = ChatBubbleItem<TextBlock<string, unknown>>

/** 与管理端分页默认条数一致，只在会话上还没有 size 时使用。 */
const FALLBACK_PAGE_SIZE = 10

export interface AgentHistoryConversation {
  id?: number
  type?: unknown
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: PageResult<HistoryBubble>
}

export interface AgentHistoryHost {
  noMoreText: () => string
  nowUnix: () => number
  resolveRole: (message: AgentMessageEntity) => ChatRole
  isWorkspace: (conversation: {type?: unknown}) => boolean
  scrollToBottom: () => void
  jumpToMessage: (key: string) => void
}

/**
 * Agent 历史分页、锚点跳转、切换会话。
 * 不恢复翻页锚点。切走前落草稿留在宿主的 activateConversation。
 */
export function useAgentHistory<TSession extends AgentHistoryConversation>(
  session: Ref<TSession | undefined>,
  host: AgentHistoryHost,
) {
  let pageLock = false

  function active(): AgentHistoryConversation | undefined {
    return session.value
  }

  async function loadPage(number: number, clear: boolean = false): Promise<void> {
    const current = active()
    if (!current || pageLock) {
      return
    }
    try {
      pageLock = true
      const result: RestResult<PageResult<AgentMessageEntity>> = await AgentService.histories(
        {number, size: current.dataSource.size || FALLBACK_PAGE_SIZE},
        Number(current.id),
      )
      if (!result.data) {
        return
      }
      applyHistoryPage(current, result.data, clear)
      for (const message of result.data.elements || []) {
        appendMessages(message, host.resolveRole(message), current.dataSource.elements)
      }
    } finally {
      pageLock = false
    }
  }

  async function loadMore(tag: 'next' | 'previous'): Promise<void> {
    await nextTick()
    const current = active()
    if (!current || current.loading || pageLock) {
      return
    }
    if (!canLoadHistory(current, tag)) {
      return
    }
    // 锚点滚动恢复保持关闭，不调用 pageEdgeBubble。
    current.dataSource.number = stepPageNumber(current.dataSource.number, tag)
    await loadPage(current.dataSource.number)
    await nextTick()
    prependNoMoreIfLast(current, tag, textBubble(host.nowUnix(), host.noMoreText()))
  }

  async function positioningMessage(messageId: number): Promise<void> {
    const current = active()
    if (!current) {
      return
    }
    try {
      current.loading = true
      const result: RestResult<number> = await AgentService.positioningMessagePageNumber(
        Number(current.id),
        messageId,
        current.dataSource.size || FALLBACK_PAGE_SIZE,
      )
      if (result.data) {
        await jumpToAnchorPage(messageId, result.data)
      }
    } finally {
      current.loading = false
    }
  }

  async function jumpToAnchorPage(
    messageId: number,
    pageNumber: number,
    systemMessage?: string,
  ): Promise<void> {
    const current = active()
    if (!current) {
      return
    }
    openPageEdges(current)
    current.loading = true
    try {
      await loadPage(pageNumber, true)
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

  async function switchConversation(
    conversation: Ref<TSession | undefined>,
    messageId?: number,
    reload: boolean = false,
  ): Promise<void> {
    if (!conversation.value || !host.isWorkspace(conversation.value)) {
      return
    }
    if (!messageId) {
      const current = conversation.value
      current.loading = true
      try {
        current.isOnFirstPage = true
        current.isOnLastPage = false
        await loadPage(1, reload)
        await nextTick()
        host.scrollToBottom()
      } finally {
        current.loading = false
      }
    } else {
      await positioningMessage(messageId)
    }
  }

  return {
    loadPage,
    loadMore,
    switchConversation,
    jumpToAnchorPage,
    positioningMessage,
  }
}

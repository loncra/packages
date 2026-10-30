import {onUnmounted} from 'vue'
import type {AgentToolCallBlock} from '@loncra/chat-core'
import type {
  AgentSession,
  AgentSseMessageContent,
  AgentStatusChangeSse,
  AgentTokenUsageContent,
  BlockDeltaContentMetadata,
  GenerateConversationName
} from '../types.ts'
import type {AgentStreamConnection, AgentStreamTransport} from '@loncra/client/ai'
import {
  AgentService,
  AI_SERVER_AGENT_BLOCK_STATUS,
  AI_SERVER_AGENT_CONTENT_TYPE,
  CHAT_BUBBLE_TYPE,
  STREAM_APPEND_TYPES,
  STREAM_RUNNING_STATUS_VALUE,
  UPDATE_CONVERSATION_TYPES,
} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {updateSessionMessage} from '../../session/write.ts'
import {createXAgentStreamTransport} from './xAgentStreamTransport.ts'

const TOKEN_USAGE = AI_SERVER_AGENT_CONTENT_TYPE.TOKEN_USAGE

export function getConversationRuns(conversation: AgentSession) {
  return conversation.dataSource.elements.filter((item) => {
    if (item.role !== CHAT_BUBBLE_TYPE.AI) {
      return false
    }
    const status = (item as {status?: unknown}).status
    if (status == null) {
      return false
    }
    return STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(status as number))
  })
}

/** 已消费的 SSE 事件（assistantMessageId + sseEventId），重连/重放时吸收重复事件 */
const consumedSseEventIds = new Map<string, Set<string>>()

function consumeSseEvent(assistantMessageId: string, sseEventId: string | undefined): boolean {
  if (!sseEventId) {
    return true
  }
  let consumed = consumedSseEventIds.get(assistantMessageId)
  if (!consumed) {
    consumed = new Set()
    consumedSseEventIds.set(assistantMessageId, consumed)
  }
  if (consumed.has(sseEventId)) {
    return false
  }
  consumed.add(sseEventId)
  return true
}

export function useAgentStream(options: {
  current: () => AgentSession | undefined
  transport?: AgentStreamTransport
  buildHeaders: () => Record<string, string>
}) {
  const {current, buildHeaders} = options
  const connections = new Map<number, AgentStreamConnection>()

  function getStreamBubble(assistantId: number) {
    const active = current()
    if (!active) {
      return
    }
    return active.dataSource.elements
      .filter((item) => item.role === CHAT_BUBBLE_TYPE.AI)
      .find((item) => Number(item.id) === assistantId)
  }

  function disconnect(assistantId: number): void {
    const connection = connections.get(assistantId)
    try {
      connection?.abort()
    } finally {
      connections.delete(assistantId)
    }
  }

  function onEvent(chunk: {data?: string}) {
    const active = current()
    if (!active || chunk.data == null) {
      return
    }
    const sseData: AgentSseMessageContent = JSON.parse(String(chunk.data))
    if (!consumeSseEvent(String(sseData.assistantMessageId), sseData.sseEventId)) {
      return
    }
    updateSessionMessage(active.dataSource.elements, String(sseData.assistantMessageId), (bubble) => {
      if (!bubble.content) {
        bubble.content = []
      }
      const contentTypes = Object.values(AI_SERVER_AGENT_CONTENT_TYPE) as string[]
      if (!contentTypes.includes(sseData.type)) {
        return
      }
      if (STREAM_APPEND_TYPES.includes(sseData.type)) {
        const content = bubble.content as unknown as AgentSseMessageContent[]
        if (!content.some((item) => item.id === sseData.id && sseData.type === item.type)) {
          content.push(sseData)
          if (getEnumValue(sseData.type) === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
            (sseData as {expanded?: boolean}).expanded = true
          }
        } else {
          appendContent(sseData as BlockDeltaContentMetadata, content)
        }
      } else if (UPDATE_CONVERSATION_TYPES.includes(sseData.type)) {
        updateConversation(sseData)
      } else if (TOKEN_USAGE === sseData.type) {
        updateTokenUsage(sseData as AgentTokenUsageContent)
      }
    })
  }

  function updateTokenUsage(sse: AgentTokenUsageContent) {
    const elements = current()?.dataSource.elements
    if (!elements) {
      return
    }
    updateSessionMessage(elements, String(sse.assistantMessageId), (item) => {
      const row = item as {metadata?: {tokenUsage?: AgentTokenUsageContent[]}}
      if (!row.metadata) {
        row.metadata = {}
      }
      if (!row.metadata.tokenUsage) {
        row.metadata.tokenUsage = []
      }
      const tokenUsage = row.metadata.tokenUsage
      const found = tokenUsage.find((item) => getEnumValue(item.usageType) === getEnumValue(sse.usageType))
      if (found) {
        found.inputTokens += sse.inputTokens
        found.outputTokens += sse.outputTokens
        found.cachedTokens += sse.cachedTokens
      } else {
        tokenUsage.push(sse)
      }
    })
  }

  function updateConversation(sse: AgentSseMessageContent) {
    const active = current()
    if (!active || String(active.id) !== sse.id) {
      return
    }
    if (sse.type === AI_SERVER_AGENT_CONTENT_TYPE.AGENT_STATUS_CHANGE) {
      const status = getEnumValue((sse as AgentStatusChangeSse).status)
      active.status = status
      if (status === undefined) {
        return
      }
      updateSessionMessage(active.dataSource.elements, String(sse.assistantMessageId), (element) => {
        if (!('status' in element)) {
          return
        }
        element.status = status
      })
    } else if (sse.type === AI_SERVER_AGENT_CONTENT_TYPE.GENERATE_CONVERSATION_NAME) {
      active.name = getEnumValue((sse as GenerateConversationName).metadata.name)
    }
  }

  function appendContent(chunk: BlockDeltaContentMetadata, content: AgentSseMessageContent[]) {
    const found = content.find((item) => item.id === chunk.id && item.type === chunk.type)
    if (!found) {
      return
    }
    const text = found as BlockDeltaContentMetadata
    if (!text.value) {
      text.value = ''
    }
    text.value += chunk.value || ''
    if (chunk.status) {
      text.status = chunk.status
    }
    if (chunk.endTime) {
      text.endTime = chunk.endTime
    }
    if (getEnumValue(text.status) !== AI_SERVER_AGENT_BLOCK_STATUS.RUNNING && text.type === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
      (text as {expanded?: boolean}).expanded = false
    }
    if (chunk.type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL) {
      const tool = found as AgentToolCallBlock
      const incoming = chunk as AgentToolCallBlock
      if (incoming.outputText) {
        tool.outputText = (tool.outputText || '') + incoming.outputText
      }
      if (incoming.userConfirmed !== undefined) {
        tool.userConfirmed = incoming.userConfirmed
      }
      tool.resultState = incoming.resultState || tool.resultState
      tool.hitlStatus = incoming.hitlStatus || tool.hitlStatus
    }
  }

  function connect(assistantId: number, loadHistory: boolean = true): void {
    if (connections.has(assistantId) || !getStreamBubble(assistantId)) {
      return
    }
    const connection = (options.transport ?? createXAgentStreamTransport()).open(
      AgentService.buildStreamUrl(assistantId, loadHistory),
      {
        ...buildHeaders(),
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      {
        onUpdate: (data: string) => onEvent({data}),
        onSuccess: () => disconnect(assistantId),
        onError: (error: unknown) => {
          console.error(error)
        },
      },
    )
    connections.set(assistantId, connection)
  }

  function disconnectIfRunning(): void {
    const active = current()
    if (!active) {
      return
    }
    for (const run of getConversationRuns(active)) {
      disconnect(Number(run.id))
    }
  }

  onUnmounted(() => {
    disconnectIfRunning()
    consumedSseEventIds.clear()
  })

  return {
    connect,
    disconnectIfRunning,
    disconnect,
  }
}

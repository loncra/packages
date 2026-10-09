import {computed, reactive} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import type {ThoughtChainItemType} from '@antdv-next/x'
import type {AgentContentBlock, AgentErrorBlock, AgentThinkBlock, AgentToolCallBlock} from '@loncra/chat-core'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {
  AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE,
  AI_SERVER_AGENT_BLOCK_STATUS,
  AI_SERVER_AGENT_CONTENT_TYPE,
  AI_SERVER_AGENT_TOOL_BLOCK_STATUS,
  AgentService,
  BLOCK_RUNNING_STATUS_VALUE,
} from '@loncra/client/ai'
import type {BlockGroup, ThoughtChainItemDataType} from './types.ts'

type AssistantItem = {
  key: string | number
  content: AgentContentBlock[]
  status?: NameValueEnumMetadata<number> | number
}

type ContentPiece = AgentContentBlock & {
  id?: string
  metadata?: {message?: string}
}

export function isBlockRunning(block: {status: NameValueEnumMetadata<string> | string}): boolean {
  return BLOCK_RUNNING_STATUS_VALUE.includes(getEnumValue(block.status))
}

export function getTavilySearchSourceConfig(json: string) {
  if (!json) {
    return
  }
  const object = JSON.parse(json)
  return {
    title: object.query,
    status: object.status,
    items: object.results.map((item: {title: string; content: string; favicon: string; url: string}) => ({
      title: item.title,
      content: item.content,
      favicon: item.favicon,
      url: item.url,
    })),
  }
}

export function getTavilyExtractResult(json: string) {
  if (!json) {
    return []
  }
  const object = JSON.parse(json)
  return object.results
}

export function findToolConfirmedItem(tools: AgentToolCallBlock[]) {
  return tools
    .filter((item) => AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE.includes(item.hitlStatus))
    .filter((item) => getEnumValue(item.status) === AI_SERVER_AGENT_BLOCK_STATUS.PENDING)
    .filter((item) => item.userConfirmed === undefined)
}

export function hasToolConfirmed(tools: AgentToolCallBlock[]) {
  return findToolConfirmedItem(tools).length > 0
}

export function getToolChainStatus(block: AgentToolCallBlock): ThoughtChainItemType['status'] {
  const status = getEnumValue(block.status)
  if (status === AI_SERVER_AGENT_BLOCK_STATUS.RUNNING) {
    return 'loading'
  }
  if (block.resultState === 'error' || status === AI_SERVER_AGENT_BLOCK_STATUS.FAILED) {
    return 'error'
  }
  if (block.resultState === 'success') {
    return 'success'
  }
  if (block.userConfirmed === false && getEnumValue(block.status) === AI_SERVER_AGENT_BLOCK_STATUS.DONE) {
    return 'abort'
  }
  return undefined
}

export function useAgentAssistantContent(
  item: AssistantItem,
  onResume: (assistantMessageId: number) => void,
) {
  const {message} = useApp()
  const toolCallUserState = reactive<Record<string, boolean | undefined>>({})

  const groupedBlocks = computed<BlockGroup[]>(() => {
    const groupMap = new Map<string, BlockGroup>()
    const orderedKeys: string[] = []

    function ensureGroup(key: string): BlockGroup {
      if (!groupMap.has(key)) {
        groupMap.set(key, {groupId: key, toolBlocks: []})
        orderedKeys.push(key)
      }
      return groupMap.get(key)!
    }

    for (const block of item.content as ContentPiece[]) {
      const type = getEnumValue(block.type as string)
      const id = block.id ?? ''
      if (type === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
        ensureGroup(id).thinkBlock = block as AgentThinkBlock
      } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.ANSWER) {
        ensureGroup(id).answerBlock = block as AgentContentBlock as BlockGroup['answerBlock']
      } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL) {
        const toolBlock = block as AgentToolCallBlock
        ensureGroup(toolBlock.groupId || id).toolBlocks.push(toolBlock)
      } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.ERROR) {
        const error = block as AgentErrorBlock & {metadata?: {message?: string}}
        if (!error.value) {
          error.value = error.metadata?.message ?? ''
        }
        ensureGroup(id).errorBlock = error
      }
    }

    return orderedKeys.map((key) => groupMap.get(key)!)
  })

  const toolCallExpandedState = computed<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {}
    for (const group of groupedBlocks.value) {
      const chosen = toolCallUserState[group.groupId]
      result[group.groupId] = chosen !== undefined
        ? chosen
        : group.toolBlocks.some((block) => BLOCK_RUNNING_STATUS_VALUE.includes(getEnumValue(block.status)))
    }
    return result
  })

  function toggleToolCallExpanded(groupId: string) {
    toolCallUserState[groupId] = !toolCallExpandedState.value[groupId]
  }

  function toThoughtChainItem(block: AgentToolCallBlock): ThoughtChainItemDataType {
    const running = getEnumValue(block.status) === AI_SERVER_AGENT_BLOCK_STATUS.RUNNING
    return {
      key: block.id,
      title: block.name,
      description: block.value,
      content: block.outputText,
      data: block,
      status: getToolChainStatus(block),
      blink: running,
      collapsible: true,
    }
  }

  async function clickToolConfirmed(tool: AgentToolCallBlock, confirmed: boolean) {
    const contents = item.content as ContentPiece[]
    const find = contents.find((block) => block.id === tool.id)
    if (!find || !('hitlStatus' in find)) {
      return
    }
    const findTool = find as AgentToolCallBlock
    if (!AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE.includes(findTool.hitlStatus)) {
      return
    }
    const previous = findTool.userConfirmed
    findTool.userConfirmed = confirmed
    const tools = contents
      .filter((block) => block.type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL)
      .map((block) => block as AgentToolCallBlock)
    if (hasToolConfirmed(tools)) {
      return
    }
    const toolBlocks = tools.filter((block) =>
      getEnumValue(block.status) === AI_SERVER_AGENT_BLOCK_STATUS.PENDING
      && block.userConfirmed !== undefined,
    )
    try {
      const result = await AgentService.resume({
        assistantMessageId: Number(item.key),
        confirmResults: toolBlocks.map((block) => ({
          toolCallId: block.id,
          confirmed: block.userConfirmed || false,
        })),
      })
      if (!result.data) {
        throw new Error(result.message)
      }
      onResume(Number(item.key))
      toolBlocks.forEach((block) => {
        block.hitlStatus = AI_SERVER_AGENT_TOOL_BLOCK_STATUS.FINISHED
      })
    } catch (error) {
      findTool.userConfirmed = previous
      message.error(error instanceof Error ? error.message : String(error))
    }
  }

  async function clickAllToolConfirmed(tools: AgentToolCallBlock[], confirmed: boolean) {
    for (const tool of tools) {
      await clickToolConfirmed(tool, confirmed)
    }
  }

  function hasContent() {
    return item.content.length > 0
  }

  return {
    clickToolConfirmed,
    clickAllToolConfirmed,
    toolCallExpandedState,
    groupedBlocks,
    hasContent,
    toThoughtChainItem,
    toggleToolCallExpanded,
  }
}

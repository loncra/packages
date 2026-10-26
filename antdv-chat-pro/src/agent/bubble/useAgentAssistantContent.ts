import {computed, reactive} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import type {ThoughtChainItemType} from '@antdv-next/x'
import type {AgentContentBlock, AgentThinkBlock, AgentToolCallBlock} from '@loncra/chat-core'
import {getEnumValue} from '@loncra/client/commons'
import {
  AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE,
  AI_SERVER_AGENT_BLOCK_STATUS,
  AI_SERVER_AGENT_CONTENT_TYPE,
  AI_SERVER_AGENT_TOOL_BLOCK_STATUS,
  AgentService,
  BLOCK_RUNNING_STATUS_VALUE,
} from '@loncra/client/ai'
import type {AgentAssistantItem, BlockGroup, ThoughtChainItemDataType} from './types'

type ContentPiece = AgentContentBlock & {
  id?: string
  metadata?: {message?: string}
}

export function isBlockRunning(block: {status: unknown}): boolean {
  return BLOCK_RUNNING_STATUS_VALUE.includes(getEnumValue(block.status as string))
}

export function markdownAttrs(extra: Record<string, unknown>): Record<string, unknown> {
  return extra
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

export function toThoughtChainItem(block: AgentToolCallBlock): ThoughtChainItemDataType {
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

function groupContentBlocks(content: ContentPiece[]): BlockGroup[] {
  const groupMap = new Map<string, BlockGroup>()
  const orderedKeys: string[] = []

  function ensureGroup(key: string): BlockGroup {
    if (!groupMap.has(key)) {
      groupMap.set(key, {groupId: key, toolBlocks: []})
      orderedKeys.push(key)
    }
    return groupMap.get(key)!
  }

  for (const block of content) {
    const type = getEnumValue(block.type as string)
    const id = block.id ?? ''
    if (type === AI_SERVER_AGENT_CONTENT_TYPE.THINK) {
      ensureGroup(id).thinkBlock = block as unknown as AgentThinkBlock
    } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.ANSWER) {
      ensureGroup(id).answerBlock = block as unknown as BlockGroup['answerBlock']
    } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL) {
      const toolBlock = block as unknown as AgentToolCallBlock
      ensureGroup(toolBlock.groupId || id).toolBlocks.push(toolBlock)
    } else if (type === AI_SERVER_AGENT_CONTENT_TYPE.ERROR) {
      ensureGroup(id).errorBlock = block as BlockGroup['errorBlock']
    }
  }

  return orderedKeys.map((key) => groupMap.get(key)!)
}

export function useAgentAssistantContent(
  item: AgentAssistantItem,
  onResume: (assistantMessageId: number) => void,
) {
  const {message} = useApp()
  const toolCallUserState = reactive<Record<string, boolean | undefined>>({})

  const groupedBlocks = computed<BlockGroup[]>(() => groupContentBlocks(item.content as ContentPiece[]))

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

  async function resumeIfAllDecided(previous: Array<{tool: AgentToolCallBlock; value: boolean | undefined}>) {
    const tools = (item.content as ContentPiece[])
      .filter((block) => block.type === AI_SERVER_AGENT_CONTENT_TYPE.TOOL)
      .map((block) => block as AgentToolCallBlock)
    if (hasToolConfirmed(tools)) {
      return
    }
    const decided = tools.filter((block) =>
      getEnumValue(block.status) === AI_SERVER_AGENT_BLOCK_STATUS.PENDING
      && block.userConfirmed !== undefined,
    )
    try {
      const result = await AgentService.resume({
        assistantMessageId: Number(item.key),
        confirmResults: decided.map((block) => ({
          toolCallId: block.id,
          confirmed: block.userConfirmed || false,
        })),
      })
      if (!result.data) {
        throw new Error(result.message)
      }
      onResume(Number(item.key))
      decided.forEach((block) => {
        block.hitlStatus = AI_SERVER_AGENT_TOOL_BLOCK_STATUS.FINISHED
      })
    } catch (error) {
      previous.forEach(({tool, value}) => {
        tool.userConfirmed = value
      })
      message.error(error instanceof Error ? error.message : String(error))
    }
  }

  function clickToolConfirmed(tool: AgentToolCallBlock, confirmed: boolean) {
    const contents = item.content as ContentPiece[]
    const find = contents.find((block) => block.id === tool.id)
    if (!find || !('hitlStatus' in find)) {
      return
    }
    const findTool = find as AgentToolCallBlock
    if (!AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE.includes(findTool.hitlStatus)) {
      return
    }
    const previous = [{tool: findTool, value: findTool.userConfirmed}]
    findTool.userConfirmed = confirmed
    void resumeIfAllDecided(previous)
  }

  function clickAllToolConfirmed(tools: AgentToolCallBlock[], confirmed: boolean) {
    const previous = tools
      .filter((tool) => AGENT_TOOL_BLOCK_CONFIRM_STATUS_VALUE.includes(tool.hitlStatus))
      .map((tool) => ({tool, value: tool.userConfirmed}))
    previous.forEach(({tool}) => {
      tool.userConfirmed = confirmed
    })
    void resumeIfAllDecided(previous)
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

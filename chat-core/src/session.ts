/**
 * 活跃会话与气泡列表项。
 *
 * 来源：vue-basic-admin/src/types/composables/chat.ts 的 ActiveChatSession、ChatBubbleItem、BaseChatBubble。
 * TBlock 至少是 TextBlock：有 type 和 value。IM 用 ImContentBlock，Agent 用 AgentContentBlock。
 *
 * 分页没有单独的查询类型。现有 loadPage 直接改 PageResult.number / first / last
 * （useChatMessageLoader.ts、useAgentMessageLoader.ts）。
 *
 * 不在本文件：BubbleListProps、BubbleListCallbacks（含 HTMLElement），留给 antdv-chat。
 */
import type {PageResult, VersionEntityMetadata} from '@loncra/client/commons'
import type {TextBlock} from './content.ts'

/**
 * 来源：vue-basic-admin/src/constants/systemConstant.ts CHAT_BUBBLE_TYPE。
 * 管理端实际赋的就是这四个字符串。divider 是列表分隔，不是服务端消息角色。
 */
export type ChatRole = 'ai' | 'system' | 'user' | 'divider'

/** 来源：chat.ts BaseChatBubble。TBlock 至少有 TextBlock 的 type 和 value。 */
export interface ChatBubbleBody<TBlock extends TextBlock<string, unknown>>
  extends VersionEntityMetadata {
  content: TBlock[]
}

/**
 * 列表项就是消息体本身，再加上气泡才有的 key / role / 显隐。
 * 来源：chat.ts ChatBubbleItem。不再另挂 data，也不把 content 收成字符串。
 * IM 业务字段在 ImChatBubble，Agent 业务字段在 AgentChatBubble。
 */
export interface ChatBubbleItem<TBlock extends TextBlock<string, unknown>>
  extends ChatBubbleBody<TBlock> {
  key: string | number
  role: ChatRole
  hide?: boolean
  flashPending?: boolean
  /** 来源：chat.ts。ax-bubble 的 loading。 */
  loading?: boolean
}

/** 「没有更多」、锚点提示、时间分隔。这些行没有消息 id，正文是一条 TextBlock。 */
export function textBubble(
  key: string | number,
  value: string,
  role: 'system' | 'divider' = 'system',
  creationTime?: number,
): ChatBubbleItem<TextBlock> {
  return {
    key,
    role,
    content: [{type: 'text', value}],
    ...(creationTime === undefined ? {} : {creationTime}),
  }
}

/**
 * ax-bubble 的 system / divider 把 content 当文本节点。
 * 模型里仍是 TextBlock；只有单条文本才取出 value 交给组件。
 * 入参按 type + value 收，IM / Agent / 纯展示行都能传。
 */
export function bubbleListContent(item: {
  role: ChatRole
  content: readonly TextBlock<string, unknown>[]
}): string | readonly TextBlock<string, unknown>[] {
  const block = item.content[0]
  if (
    (item.role === 'system' || item.role === 'divider')
    && item.content.length === 1
    && block?.type === 'text'
    && typeof block.value === 'string'
  ) {
    return block.value
  }
  return item.content
}

/** 来源：chat.ts ActiveChatSession */
export interface ActiveChatSession<
  TBubble extends ChatBubbleItem<TextBlock<string, unknown>>,
> {
  loading: boolean
  isOnFirstPage?: boolean
  isOnLastPage?: boolean
  dataSource: PageResult<TBubble>
}

/**
 * 来源：vue-basic-admin/src/utils/chatUtils.ts addBubbleListMessage。
 * 同 key 整条替换。新的 system 按块拆成多行，每行 content 是那一块，不再写成字符串。
 * append 为 false 插到头部。
 */
export function appendMessages<TBlock extends TextBlock<string, unknown>>(
  body: ChatBubbleBody<TBlock>,
  role: ChatRole,
  bubbleList: ChatBubbleItem<TBlock>[],
  append = false,
  hide = false,
): void {
  const content = body.content ?? []
  const key = String(body.id)
  const toItem = (blocks: TBlock[]): ChatBubbleItem<TBlock> => ({
    ...body,
    key,
    role,
    content: blocks,
    hide,
  })
  const index = bubbleList.findIndex((b) => b.key === key)
  if (index >= 0) {
    bubbleList[index] = toItem(content)
    return
  }

  const items = role === 'system'
    ? content.map((block) => toItem([block]))
    : [toItem(content)]

  if (!append) {
    bubbleList.splice(0, 0, ...items)
  } else {
    bubbleList.push(...items)
  }
}

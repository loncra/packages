import {nextTick} from 'vue'
import {
  type ChatBubbleItem,
  locateAnchor,
  type TextBlock,
  textBubble,
} from '@loncra/chat-core'

/**
 * 在已加载的气泡里定位消息。有系统提示时，插在锚点前一条。
 * IM 与 Agent 的跳转都走这里。
 */
export async function revealAnchor(
  elements: ChatBubbleItem<TextBlock<string, unknown>>[],
  messageId: number,
  systemMessage: string | undefined,
  now: number,
  jump: (key: string) => void,
): Promise<void> {
  const anchorBubble = elements.find((item) => item.key === String(messageId))
  const key = locateAnchor(
    elements,
    messageId,
    systemMessage && anchorBubble
      ? textBubble(
        'system-anchor-message-' + now,
        systemMessage,
        'system',
        (anchorBubble.creationTime ?? 0) - 1,
      )
      : undefined,
  )
  await nextTick()
  if (key === undefined) {
    return
  }
  jump(String(key))
}

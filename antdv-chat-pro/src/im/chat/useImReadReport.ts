import {watch} from 'vue'
import {isEnumValue, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {ChatMessageService, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE, type UserChatMessageEntity, type UserChatMessageResponseBody,} from '@loncra/client/message'
import type {BubbleListItem} from '../../bubble-list/types'
import type {ImChatSession} from './ImChatView'
import type {ImPageHost} from '../host'

export function useImReadReport(options: {
  session: ImChatSession
  host: ImPageHost
}) {
  const {session, host} = options
  const readingSet = new Set<number>()
  const sentIds = new Set<number>()
  let readProcessing = false

  function isReadableMessage(message: UserChatMessageResponseBody | UserChatMessageEntity | undefined): boolean {
    if (!message || isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
      return false
    }
    const readable = (message as UserChatMessageResponseBody).readable
    if (readable === undefined) {
      return false
    }
    return isEnumValue(readable, YES_OR_NO_TYPE.YES) && message.principal !== host.self.systemName
  }

  async function flushReadQueue(): Promise<void> {
    if (readProcessing || readingSet.size === 0) {
      return
    }
    readProcessing = true
    try {
      while (readingSet.size > 0) {
        const batch = Array.from(readingSet)
        readingSet.clear()
        try {
          await ChatMessageService.readMessage(batch)
          batch.forEach((id) => sentIds.add(id))
          await host.refreshUnread()
        } catch (error) {
          console.error('标记已读失败:', error)
          break
        }
      }
    } finally {
      readProcessing = false
    }
  }

  function markVisible(items: BubbleListItem[]) {
    if (items.length <= 0) {
      return
    }
    for (const item of items) {
      if (!('readable' in item) || !('id' in item) || item.id == null) {
        continue
      }
      const id = Number(item.id)
      if (!sentIds.has(id)) {
        readingSet.add(id)
      }
      const metadata = session.dataSource?.metadata as {readableAnchorId?: number} | undefined
      if (id === metadata?.readableAnchorId) {
        delete metadata.readableAnchorId
      }
    }
    void flushReadQueue()
  }

  function onVisibleItems(items: BubbleListItem[]) {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) {
      return
    }
    markVisible(items.filter((item) =>
      'readable' in item && isReadableMessage(item as unknown as UserChatMessageResponseBody),
    ))
  }

  watch(() => session.item?.key, () => {
    readingSet.clear()
    sentIds.clear()
  })

  return {onVisibleItems}
}

import {computed, reactive, ref} from 'vue'
import type {UserChatConversationResponseBody} from '@loncra/client/message'
import {useLocale} from '../_util/useLocale'
import type {ImChatViewExpose} from './chat/ImChatView'
import {useImConversations} from './conversation/useImConversations'
import {useImHistory} from './history/useImHistory'
import type {ImPageHost} from './host'
import {useImChatDrafts} from './useImChatDrafts'
import {emptySession, messageRole, useImChatSessions} from './useImChatSessions'

export function useImChat(options: {
  host: ImPageHost
  emitActive: (conversation: UserChatConversationResponseBody | undefined) => void
}) {
  const {host, emitActive} = options
  const locale = useLocale('ImChat')
  const conversations = useImConversations<UserChatConversationResponseBody>()
  const session = reactive(emptySession())
  const viewRef = ref<ImChatViewExpose>()
  const drafts = useImChatDrafts()

  function scrollToBottom() {
    viewRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
  }

  const history = useImHistory(computed(() => session), {
    noMoreText: () => locale.value.noMore,
    nowUnix: () => Math.floor(Date.now() / 1000),
    readableSystemMessage: () => locale.value.unreadSystem,
    resolveRole: (message) => messageRole(message, host.self.systemName),
    beforeSwitch: async () => {
      if (session.item?.data && viewRef.value) {
        const slots = viewRef.value.getSenderSlotConfigValue()
        session.item.data.draft = slots
        drafts.rememberDraft(session.item.data.room?.id, slots)
        await viewRef.value.persistSenderDraft()
      }
    },
    scrollToBottom,
    jumpToMessage: (key, flashPending, block) => {
      viewRef.value?.jumpToMessage(key, flashPending, block)
    },
  })

  const sessions = useImChatSessions({session, conversations, history, viewRef, host, emitActive})

  async function refreshConversations() {
    const currentId = session.item?.data?.id
    await conversations.load()
    await drafts.reloadStoredDrafts(host.self.systemName)
    if (currentId != null) {
      await sessions.openConversation(currentId)
    }
  }

  return {
    session,
    conversations,
    drafts,
    history,
    viewRef,
    refreshConversations,
    scrollToBottom,
    ...sessions,
  }
}

import {onMounted, onUnmounted, ref} from 'vue'
import {ChatMessageService, type UserChatMessageReadResponseBody} from '@loncra/client/message'
import {YES_OR_NO_TYPE} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'
import type {ImChatHost} from '../host.ts'
import {IM_SOCKET_EVENT} from '../chat/socketEvents.ts'
import {parseSocketRestPayload} from '../chat/parseSocket.ts'

export function useImMessageRead(messageId: number, host: ImChatHost) {
  const locale = useLocale('ImBubble')
  const loading = ref(false)
  const dataSource = ref<UserChatMessageReadResponseBody[]>([])
  let stop: (() => void) | undefined

  onMounted(async () => {
    loading.value = true
    try {
      const result = await ChatMessageService.findMessageRead(messageId)
      dataSource.value = result.data ?? []
    } finally {
      loading.value = false
    }
    stop = host.subscribe(IM_SOCKET_EVENT.CHAT_MESSAGE_READ_UPDATE, (payload) => {
      const result = parseSocketRestPayload<Array<{id: number; value: number}>>(payload)
      const updates = result.data ?? []
      for (const row of updates) {
        const found = dataSource.value.find((item) => item.id === row.id)
        if (!found) {
          continue
        }
        found.readable = {value: YES_OR_NO_TYPE.NO, name: locale.value.read}
        found.readTime = row.value
      }
    })
  })
  onUnmounted(() => stop?.())

  return {loading, dataSource}
}

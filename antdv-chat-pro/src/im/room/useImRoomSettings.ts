import {computed, ref, watch, type ComputedRef} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {fillLocale} from '@loncra/antdv'
import {isEnumValue} from '@loncra/client/commons'
import {
    MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
    MESSAGE_SERVER_USER_CHAT_ROOM_TYPE,
    type BasicUserChatConversation,
    type UserChatConversationResponseBody,
    type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {ImChatHost} from '../host.ts'
import type {ImRoomMemberModalMode} from './ImRoomMemberModal.ts'
import {isSelfManager, isSelfOwner} from './imRoomKinds.ts'
import type {ImConversationsApi} from '../conversation/useImConversations.ts'
import type {ImRoomActions} from './useImRoomActions.ts'

export type {ImRoomActions}
import {useLocale} from '../../_util/useLocale.ts'

export function useImRoomSettings(options: {
  conversation: ComputedRef<UserChatConversationResponseBody | undefined>
  participants: ComputedRef<UserChatParticipantEntity[]>
  host: ImChatHost
  actions: ImRoomActions
  conversations: ImConversationsApi<UserChatConversationResponseBody>
  onMuted: (conversation: BasicUserChatConversation) => void
  onDeleted: (conversation: UserChatConversationResponseBody) => void
}) {
  const {host, actions, conversations, onMuted, onDeleted} = options
  const conversation = options.conversation
  const participants = options.participants
  const locale = useLocale('ImRoom')
  const {modal} = useApp()

  const keyword = ref('')
  const editing = ref(false)
  const draftName = ref('')
  const historiesOpen = ref(false)
  const memberModal = ref<ImRoomMemberModalMode>()

  const enabled = computed(() =>
    isEnumValue(conversation.value?.status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED),
  )
  const group = computed(() =>
    isEnumValue(conversation.value?.room?.type, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT),
  )
  const selfCanManage = computed(() => isSelfManager(participants.value, host.self.systemName))
  const selfIsOwner = computed(() => isSelfOwner(participants.value, host.self.systemName))

  watch(() => conversation.value?.id, () => {
    keyword.value = ''
    editing.value = false
    historiesOpen.value = false
    memberModal.value = undefined
  })

  function openAdd() {
    if (conversation.value?.room?.id == null) {
      return
    }
    memberModal.value = 'add'
  }

  function openMemberSetting() {
    if (conversation.value?.room?.id == null) {
      return
    }
    memberModal.value = 'member'
  }

  function openHistories() {
    if (conversation.value?.room?.id == null) {
      return
    }
    historiesOpen.value = true
  }

  function startRename() {
    draftName.value = conversation.value?.name ?? ''
    editing.value = true
  }

  function cancelRename() {
    draftName.value = conversation.value?.name ?? ''
    editing.value = false
  }

  async function confirmRename() {
    const current = conversation.value
    const name = draftName.value.trim()
    if (!current?.room?.id || name === '') {
      return
    }
    if (await actions.rename(current, name)) {
      editing.value = false
    }
  }

  async function onPin() {
    const current = conversation.value
    if (!current) {
      return
    }
    await conversations.toggleFlag('pinned', current)
  }

  async function onMute() {
    const current = conversation.value
    if (!current) {
      return
    }
    const returned = await conversations.toggleFlag('muted', current)
    if (returned) {
      onMuted(returned)
    }
  }

  async function removeConversation() {
    const current = conversation.value
    if (!current) {
      return
    }
    if (await actions.remove(current)) {
      onDeleted(current)
    }
  }

  async function exitRoom() {
    const roomId = conversation.value?.room?.id
    if (roomId == null) {
      return
    }
    await actions.exit(Number(roomId))
  }

  async function disbandRoom() {
    const roomId = conversation.value?.room?.id
    if (roomId == null) {
      return
    }
    await actions.disband(Number(roomId))
  }

  function confirmExit() {
    const current = conversation.value
    if (!current) {
      return
    }
    if (enabled.value) {
      modal.confirm({
        title: locale.value.exitConfirmTitle,
        content: fillLocale(locale.value.exitConfirmContent, {name: current.name}),
        onOk: () => exitRoom(),
      })
      return
    }
    confirmDelete()
  }

  function confirmDelete() {
    modal.confirm({
      title: locale.value.deleteConfirmTitle,
      content: locale.value.deleteConfirmContent,
      onOk: () => removeConversation(),
    })
  }

  function confirmDisband() {
    const current = conversation.value
    if (!current?.room?.id) {
      return
    }
    modal.confirm({
      title: locale.value.disbandConfirmTitle,
      content: fillLocale(locale.value.disbandConfirmContent, {name: current.name}),
      onOk: () => disbandRoom(),
    })
  }

  const pinPending = computed(() => conversations.isFlagPending('pinned', conversation.value?.id))
  const mutePending = computed(() => conversations.isFlagPending('muted', conversation.value?.id))

  return {
    keyword,
    editing,
    draftName,
    historiesOpen,
    memberModal,
    enabled,
    group,
    selfCanManage,
    selfIsOwner,
    pinPending,
    mutePending,
    openAdd,
    openMemberSetting,
    openHistories,
    startRename,
    cancelRename,
    confirmRename,
    onPin,
    onMute,
    confirmExit,
    confirmDelete,
    confirmDisband,
  }
}

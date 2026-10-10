import {computed, defineComponent, ref, watch, type PropType} from 'vue'
import {Button, Modal, Popconfirm, Space, SpaceCompact} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {SystemUserPanel, type SystemUserContactItem} from '@loncra/antdv-pro'
import {fillLocale} from '@loncra/antdv'
import {
  isEnumValue,
  type NameValueEnumMetadata,
  type RestResult,
} from '@loncra/client/commons'
import {
  ChatMessageService,
  MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
  type UserChatConversationResponseBody,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {ImHost} from '../host.ts'
import {useLocale} from '../../_util/useLocale.ts'

export type ImRoomMemberModalMode = 'add' | 'member'

function participantTypeOf(item: SystemUserContactItem): number | NameValueEnumMetadata<number> | undefined {
  const value = item.participantType
  if (typeof value === 'number' || (value != null && typeof value === 'object' && 'value' in value)) {
    return value as number | NameValueEnumMetadata<number>
  }
  return undefined
}

const ImRoomMemberModal = defineComponent({
  name: 'LImRoomMemberModal',
  props: {
    mode: {
      type: String as PropType<ImRoomMemberModalMode | undefined>,
      default: undefined,
    },
    roomId: {type: Number, default: undefined},
    contacts: {
      type: Array as PropType<SystemUserContactItem[]>,
      default: () => [],
    },
    participants: {
      type: Array as PropType<UserChatParticipantEntity[]>,
      default: () => [],
    },
    host: {type: Object as PropType<ImHost>, required: true},
  },
  emits: {
    'update:mode': (_mode: ImRoomMemberModalMode | undefined) => true,
    added: (_result: RestResult<UserChatConversationResponseBody>) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('ImRoom')
    const {message} = useApp()
    const busy = ref(false)
    const selectedUsers = ref<SystemUserContactItem[]>([])

    const panelContacts = computed(() => {
      if (props.mode === 'add') {
        return props.contacts
      }
      if (props.mode === 'member') {
        return props.participants
          .filter((item) => item.principal !== props.host.selfName)
          .map((item) => ({
            key: String(item.metadata.details.id),
            label: props.host.principalName(item.metadata.details),
            data: item.metadata.details,
            participantType: item.type,
          }))
      }
      return []
    })

    watch(() => props.mode, () => {
      selectedUsers.value = []
    })

    function close() {
      emit('update:mode', undefined)
    }

    function filterContact(item: SystemUserContactItem): boolean {
      if (props.mode !== 'add') {
        return true
      }
      return !props.participants.some((participant) => participant.metadata.details.id === item.data.id)
    }

    function selectedPrincipals(): string[] {
      return selectedUsers.value.map((item) => item.data.systemName)
    }

    async function confirmAdd() {
      const principals = selectedPrincipals()
      if (props.roomId == null || principals.length <= 0) {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.addRoomParticipant(props.roomId, principals)
        emit('added', result)
        close()
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function updateParticipantType(type: number) {
      const principals = selectedPrincipals()
      if (props.roomId == null || principals.length <= 0) {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.updateParticipantType(props.roomId, type, principals)
        message.success(result.message)
        close()
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function removeMembers() {
      const principals = selectedPrincipals()
      if (props.roomId == null || principals.length <= 0) {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.removeRoomParticipant(props.roomId, principals)
        message.success(result.message)
        close()
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    return () => {
      const coOwnerCount = selectedUsers.value.filter((item) => {
        const type = participantTypeOf(item)
        return type != null && isEnumValue(type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.CO_OWNER)
      }).length
      const memberCount = selectedUsers.value.filter((item) => {
        const type = participantTypeOf(item)
        return type != null && isEnumValue(type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER)
      }).length
      return (
        <Modal
          open={props.mode != null}
          title={props.mode === 'member' ? locale.value.memberManager : locale.value.addParticipant}
          width={{xs: '90%', sm: '80%', md: '70%', lg: '60%', xl: '60%', xxl: '60%'}}
          confirmLoading={busy.value}
          onCancel={close}
          onOk={confirmAdd}
          v-slots={{
            footer: ({extra}: {extra: {OkBtn: any; CancelBtn: any}}) => (
              <Space>
                {props.mode === 'member'
                  ? (
                    <SpaceCompact>
                      <Button
                        loading={busy.value}
                        disabled={coOwnerCount <= 0}
                        onClick={() => updateParticipantType(MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER)}
                      >
                        {locale.value.changeMember}
                      </Button>
                      <Button
                        loading={busy.value}
                        disabled={memberCount <= 0}
                        onClick={() => updateParticipantType(MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.CO_OWNER)}
                      >
                        {locale.value.changeCoOwner}
                      </Button>
                      <Popconfirm
                        title={locale.value.removeMemberConfirmTitle}
                        description={fillLocale(locale.value.removeMemberConfirmContent, {count: selectedUsers.value.length})}
                        okButtonProps={{loading: busy.value}}
                        onConfirm={removeMembers}
                      >
                        <Button
                          loading={busy.value}
                          disabled={selectedUsers.value.length <= 0}
                          type="primary"
                          danger
                        >
                          {locale.value.removeMember}
                        </Button>
                      </Popconfirm>
                    </SpaceCompact>
                  )
                  : <extra.OkBtn />}
                <extra.CancelBtn />
              </Space>
            ),
          }}
        >
          <SystemUserPanel
            dataSource={panelContacts.value}
            value={selectedUsers.value}
            filter={filterContact}
            onUpdate:value={(value: SystemUserContactItem[]) => {
              selectedUsers.value = value
            }}
          />
        </Modal>
      )
    }
  },
})

export default ImRoomMemberModal

import {computed, defineComponent, type PropType, ref, watch} from 'vue'
import {Button, Modal, Popconfirm, Space, SpaceCompact} from 'antdv-next'
import SystemUserPanel, {type SystemUserContactItem} from '../../system-user-panel'
import {fillLocale} from '@loncra/antdv'
import {isEnumValue, type RestResult,} from '@loncra/client/commons'
import {
    MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
    type UserChatConversationResponseBody,
    type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {ImHost} from '../host.ts'
import {AuthServerService} from '@loncra/client/auth'
import {participantTypeOf} from './imRoomKinds.ts'
import {useImRoomMemberActions} from './useImRoomMemberActions.ts'
import {useLocale} from '../../_util/useLocale.ts'

export type ImRoomMemberModalMode = 'add' | 'member'

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
    const memberActions = useImRoomMemberActions()
    const busy = memberActions.busy
    const selectedUsers = ref<SystemUserContactItem[]>([])

    const panelContacts = computed(() => {
      if (props.mode === 'add') {
        return props.contacts
      }
      if (props.mode === 'member') {
        return props.participants
          .filter((item) => item.principal !== props.host.self.systemName)
          .map((item) => ({
            key: String(item.metadata.details.id),
            label: AuthServerService.getPrincipalNameByUserDetails(item.metadata.details),
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
      const result = await memberActions.addParticipants(props.roomId, principals)
      if (!result) {
        return
      }
      emit('added', result)
      close()
    }

    async function updateParticipantType(type: number) {
      const principals = selectedPrincipals()
      if (props.roomId == null || principals.length <= 0) {
        return
      }
      if (await memberActions.updateParticipants(props.roomId, type, principals)) {
        close()
      }
    }

    async function removeMembers() {
      const principals = selectedPrincipals()
      if (props.roomId == null || principals.length <= 0) {
        return
      }
      if (await memberActions.removeMembers(props.roomId, principals)) {
        close()
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

import {computed, defineComponent, ref, watch, type PropType} from 'vue'
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Empty,
  Flex,
  Input,
  Space,
  SpaceCompact,
  Switch,
  Typography,
} from 'antdv-next'
import {
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {type SystemUserContactItem, UserAvatar} from '@loncra/antdv-pro'
import {classNames, fillLocale} from '@loncra/antdv'
import {
  getEnumName,
  getEnumValue,
  isEnumValue,
  type RestResult,
  YES_OR_NO_TYPE,
} from '@loncra/client/commons'
import {
  type BasicUserChatConversation,
  ChatMessageService,
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
  MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE,
  MESSAGE_SERVER_USER_CHAT_ROOM_TYPE,
  USER_CHAT_PARTICIPANT_OWNER_TYPE_VALUE,
  type UserChatConversationResponseBody,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {ImHost} from '../host.ts'
import {deleteImConversations, muteImConversations, pinImConversations} from '../conversation/conversationActions.ts'
import ImHistoriesModal from '../history/ImHistoriesModal.tsx'
import ImRoomMemberModal, {type ImRoomMemberModalMode} from './ImRoomMemberModal.tsx'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_ROOM_PREFIX} from './style/index.ts'

function isOwnerType(participant: UserChatParticipantEntity): boolean {
  return USER_CHAT_PARTICIPANT_OWNER_TYPE_VALUE.includes(getEnumValue(participant.type))
}

const ImRoomSettings = defineComponent({
  name: 'LImRoomSettings',
  props: {
    conversation: {
      type: Object as PropType<UserChatConversationResponseBody | undefined>,
      default: undefined,
    },
    participants: {
      type: Array as PropType<UserChatParticipantEntity[]>,
      default: () => [],
    },
    contacts: {
      type: Array as PropType<SystemUserContactItem[]>,
      default: () => [],
    },
    host: {type: Object as PropType<ImHost>, required: true},
  },
  emits: {
    added: (_result: RestResult<UserChatConversationResponseBody>) => true,
    muted: (_conversation: BasicUserChatConversation) => true,
    delete: (_conversation: UserChatConversationResponseBody) => true,
  },
  setup(props, {emit, slots}) {
    const locale = useLocale('ImRoom')
    const {message, modal} = useApp()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-room', IM_ROOM_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const keyword = ref('')
    const editing = ref(false)
    const draftName = ref('')
    const busy = ref(false)
    const historiesOpen = ref(false)
    const memberModal = ref<ImRoomMemberModalMode>()

    const enabled = computed(() =>
      isEnumValue(props.conversation?.status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED),
    )
    const group = computed(() =>
      isEnumValue(props.conversation?.room?.type, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.GROUP_CHAT),
    )
    const selfCanManage = computed(() =>
      props.participants.some((item) => item.principal === props.host.selfName && isOwnerType(item)),
    )
    const selfIsOwner = computed(() =>
      props.participants.some((item) =>
        item.principal === props.host.selfName
        && isEnumValue(item.type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.OWNER),
      ),
    )
    const visibleParticipants = computed(() => {
      const text = keyword.value.trim().toLowerCase()
      if (!text) {
        return props.participants
      }
      return props.participants.filter((item) =>
        props.host.principalName(item.metadata?.details).toLowerCase().includes(text),
      )
    })

    watch(() => props.conversation?.id, () => {
      keyword.value = ''
      editing.value = false
      historiesOpen.value = false
      memberModal.value = undefined
    })

    function openAdd() {
      if (props.conversation?.room?.id == null) {
        return
      }
      memberModal.value = 'add'
    }

    function openMemberSetting() {
      if (props.conversation?.room?.id == null) {
        return
      }
      memberModal.value = 'member'
    }

    function openHistories() {
      if (props.conversation?.room?.id == null) {
        return
      }
      historiesOpen.value = true
    }

    function startRename() {
      draftName.value = props.conversation?.name ?? ''
      editing.value = true
    }

    function cancelRename() {
      draftName.value = props.conversation?.name ?? ''
      editing.value = false
    }

    async function confirmRename() {
      const conversation = props.conversation
      const name = draftName.value.trim()
      if (!conversation?.room?.id || name === '') {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.roomRename(Number(conversation.room.id), name)
        conversation.name = name
        editing.value = false
        message.success(result.message || locale.value.renameSuccess)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function onPin() {
      const conversation = props.conversation
      if (!conversation) {
        return
      }
      try {
        busy.value = true
        const returned = (await pinImConversations([Number(conversation.id)])).at(0)
        if (returned) {
          conversation.pinned = returned.pinned
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function onMute() {
      const conversation = props.conversation
      if (!conversation) {
        return
      }
      try {
        busy.value = true
        const returned = (await muteImConversations([Number(conversation.id)])).at(0)
        if (returned) {
          conversation.muted = returned.muted
          emit('muted', returned)
        }
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function removeConversation() {
      const conversation = props.conversation
      if (!conversation) {
        return
      }
      try {
        busy.value = true
        const result = await deleteImConversations([Number(conversation.id)])
        message.success(result.message)
        emit('delete', conversation)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function exitRoom() {
      const roomId = props.conversation?.room?.id
      if (roomId == null) {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.existRoom(Number(roomId))
        message.success(result.message)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    async function disbandRoom() {
      const roomId = props.conversation?.room?.id
      if (roomId == null) {
        return
      }
      try {
        busy.value = true
        const result = await ChatMessageService.disbandRoom(Number(roomId))
        message.success(result.message)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        busy.value = false
      }
    }

    function confirmExit() {
      const conversation = props.conversation
      if (!conversation) {
        return
      }
      if (enabled.value) {
        modal.confirm({
          title: locale.value.exitConfirmTitle,
          content: fillLocale(locale.value.exitConfirmContent, {name: conversation.name}),
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
      const conversation = props.conversation
      if (!conversation?.room?.id) {
        return
      }
      modal.confirm({
        title: locale.value.disbandConfirmTitle,
        content: fillLocale(locale.value.disbandConfirmContent, {name: conversation.name}),
        onOk: () => disbandRoom(),
      })
    }

    function renderMember(participant: UserChatParticipantEntity) {
      const prefix = prefixCls.value
      const name = props.host.principalName(participant.metadata?.details)
      const avatar = (
        <UserAvatar
          user={participant.metadata?.details}
          {...({size: 'large', shape: 'square'} as Record<string, unknown>)}
        />
      )
      return (
        <div key={participant.id} class={`${prefix}-member`}>
          {isOwnerType(participant)
            ? (
              <Badge.Ribbon
                class={`${prefix}-ribbon`}
                color={isEnumValue(participant.type, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.OWNER) ? 'gold' : 'yellow'}
                text={getEnumName(participant.type)}
              >
                {avatar}
              </Badge.Ribbon>
            )
            : avatar}
          <Typography.Text class={`${prefix}-member-name`} ellipsis={{tooltip: name}}>
            {name}
          </Typography.Text>
        </div>
      )
    }

    return () => {
      const prefix = prefixCls.value
      const conversation = props.conversation
      const roomId = conversation?.room?.id
      return (
        <div class={classNames(prefix, hashId.value, cssVarCls.value)}>
          {enabled.value
            ? (
              <>
                {group.value
                  ? (
                    <div class={`${prefix}-search`}>
                      <Input.Search
                        value={keyword.value}
                        allowClear
                        onUpdate:value={(value: string) => {
                          keyword.value = value
                        }}
                      />
                    </div>
                  )
                  : null}
                <div class={`${prefix}-members`}>
                  {visibleParticipants.value.map(renderMember)}
                  <div class={`${prefix}-add`} onClick={openAdd}>
                    <Avatar size="large" shape="square">
                      <UserAddOutlined />
                    </Avatar>
                    <Typography.Text>{locale.value.add}</Typography.Text>
                  </div>
                </div>
              </>
            )
            : (
              <div class={`${prefix}-empty`}>
                <Empty />
              </div>
            )}
          <div class={`${prefix}-settings`}>
            <Divider />
            <Button
              block
              type="text"
              onClick={openHistories}
              v-slots={{icon: () => <HistoryOutlined />}}
            >
              {locale.value.history}
            </Button>
            <Divider titlePlacement="start" plain>
              <Space>
                <SettingOutlined />
                <span>{locale.value.setting}</span>
              </Space>
            </Divider>
            {conversation?.room
              ? (
                <Flex vertical gap="middle">
                  {group.value
                    ? (
                      <Flex justify="space-between" align="center">
                        <Typography.Text>{locale.value.name}</Typography.Text>
                        {editing.value
                          ? (
                            <SpaceCompact>
                              <Input
                                size="small"
                                maxlength={16}
                                value={draftName.value}
                                onUpdate:value={(value: string) => {
                                  draftName.value = value
                                }}
                                onPressEnter={confirmRename}
                              />
                              <Button size="small" onClick={cancelRename} v-slots={{icon: () => <CloseOutlined />}} />
                              <Button
                                size="small"
                                type="primary"
                                loading={busy.value}
                                onClick={confirmRename}
                                v-slots={{icon: () => <CheckOutlined />}}
                              />
                            </SpaceCompact>
                          )
                          : (
                            <Space>
                              <Typography.Text>{conversation.name}</Typography.Text>
                              {selfCanManage.value && enabled.value
                                ? (
                                  <Button
                                    size="small"
                                    type="text"
                                    onClick={startRename}
                                    v-slots={{icon: () => <EditOutlined />}}
                                  />
                                )
                                : null}
                            </Space>
                          )}
                      </Flex>
                    )
                    : null}
                  {enabled.value
                    ? (
                      <>
                        <Flex justify="space-between" align="center">
                          <Typography.Text>{locale.value.pinned}</Typography.Text>
                          <Switch
                            size="small"
                            loading={busy.value}
                            checked={isEnumValue(conversation.pinned, YES_OR_NO_TYPE.YES)}
                            checkedChildren={locale.value.open}
                            unCheckedChildren={locale.value.close}
                            onChange={onPin}
                          />
                        </Flex>
                        <Flex justify="space-between" align="center">
                          <Typography.Text>{locale.value.muted}</Typography.Text>
                          <Switch
                            size="small"
                            loading={busy.value}
                            checked={isEnumValue(conversation.muted, YES_OR_NO_TYPE.YES)}
                            checkedChildren={locale.value.open}
                            unCheckedChildren={locale.value.close}
                            onChange={onMute}
                          />
                        </Flex>
                      </>
                    )
                    : null}
                  {group.value
                    ? (
                      <>
                        {selfCanManage.value && enabled.value
                          ? (
                            <Button
                              block
                              onClick={openMemberSetting}
                              v-slots={{icon: () => <UserSwitchOutlined />}}
                            >
                              {locale.value.memberManager}
                            </Button>
                          )
                          : null}
                        <SpaceCompact block>
                          <Button
                            block
                            danger
                            loading={busy.value}
                            onClick={confirmExit}
                            v-slots={{
                              icon: () => enabled.value ? <LogoutOutlined /> : <DeleteOutlined />,
                            }}
                          >
                            {enabled.value ? locale.value.exit : locale.value.deleteConversation}
                          </Button>
                          {selfIsOwner.value && enabled.value
                            ? (
                              <Button
                                block
                                danger
                                type="primary"
                                loading={busy.value}
                                onClick={confirmDisband}
                                v-slots={{icon: () => <CloseCircleOutlined />}}
                              >
                                {locale.value.disband}
                              </Button>
                            )
                            : null}
                        </SpaceCompact>
                      </>
                    )
                    : null}
                </Flex>
              )
              : conversation
                ? (
                  <Flex vertical gap="middle">
                    <Flex justify="space-between" align="center">
                      <Typography.Text>{locale.value.name}</Typography.Text>
                      <Typography.Text>{conversation.name}</Typography.Text>
                    </Flex>
                    <Button
                      block
                      danger
                      loading={busy.value}
                      onClick={confirmDelete}
                      v-slots={{icon: () => <DeleteOutlined />}}
                    >
                      {locale.value.deleteConversation}
                    </Button>
                  </Flex>
                )
                : null}
          </div>
          {conversation && roomId != null
            ? (
              <ImHistoriesModal
                open={historiesOpen.value}
                roomId={Number(roomId)}
                roomName={conversation.name}
                host={props.host}
                onUpdate:open={(open: boolean) => {
                  historiesOpen.value = open
                }}
                v-slots={{call: slots.call}}
              />
            )
            : null}
          <ImRoomMemberModal
            mode={memberModal.value}
            roomId={roomId == null ? undefined : Number(roomId)}
            contacts={props.contacts}
            participants={props.participants}
            host={props.host}
            onUpdate:mode={(mode) => {
              memberModal.value = mode
            }}
            onAdded={(result) => emit('added', result)}
          />
        </div>
      )
    }
  },
})

export default ImRoomSettings

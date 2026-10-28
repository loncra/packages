import {computed, defineComponent, type PropType} from 'vue'
import {Button, Divider, Empty, Flex, Space, Typography} from 'antdv-next'
import {DeleteOutlined, HistoryOutlined, SettingOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {type SystemUserContactItem} from '../../system-user-panel'
import {classNames} from '@loncra/antdv'
import {type RestResult,} from '@loncra/client/commons'
import {
    type BasicUserChatConversation,
    type UserChatConversationResponseBody,
    type UserChatParticipantEntity,
} from '@loncra/client/message'
import type {ImChatHost} from '../host.ts'
import type {ImConversationsApi} from '../conversation/useImConversations.ts'
import ImHistoriesModal from '../history/ImHistoriesModal.tsx'
import ImRoomGroupSettings from './ImRoomGroupSettings.tsx'
import ImRoomMemberList from './ImRoomMemberList.tsx'
import ImRoomMemberModal from './ImRoomMemberModal.tsx'
import {useImRoomSettings, type ImRoomActions} from './useImRoomSettings.ts'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {IM_ROOM_PREFIX} from './style/index.ts'

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
    host: {type: Object as PropType<ImChatHost>, required: true},
    actions: {type: Object as PropType<ImRoomActions>, required: true},
    conversations: {type: Object as PropType<ImConversationsApi<UserChatConversationResponseBody>>, required: true},
  },
  emits: {
    added: (_result: RestResult<UserChatConversationResponseBody>) => true,
    muted: (_conversation: BasicUserChatConversation) => true,
    delete: (_conversation: UserChatConversationResponseBody) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('ImRoom')
    const busy = props.actions.busy
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-room', IM_ROOM_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const {
      keyword,
      editing,
      draftName,
      historiesOpen,
      memberModal,
      enabled,
      group,
      selfCanManage,
      selfIsOwner,
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
      pinPending,
      mutePending,
    } = useImRoomSettings({
      conversation: computed(() => props.conversation),
      participants: computed(() => props.participants),
      host: props.host,
      actions: props.actions,
      conversations: props.conversations,
      onMuted: (body) => emit('muted', body),
      onDeleted: (conversation) => emit('delete', conversation),
    })

    return () => {
      const prefix = prefixCls.value
      const conversation = props.conversation
      const roomId = conversation?.room?.id
      return (
        <div class={classNames(prefix, hashId.value, cssVarCls.value)}>
          {enabled.value
            ? (
              group.value
                ? (
                  <ImRoomMemberList
                    participants={props.participants}
                    keyword={keyword.value}
                    prefixCls={prefix}
                    hashId={hashId.value}
                    cssVarCls={cssVarCls.value}
                    onUpdate:keyword={(value: string) => {
                      keyword.value = value
                    }}
                    onAdd={openAdd}
                  />
                )
                : null
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
                group.value
                  ? (
                    <ImRoomGroupSettings
                      conversation={conversation}
                      enabled={enabled.value}
                      selfCanManage={selfCanManage.value}
                      selfIsOwner={selfIsOwner.value}
                      busy={busy.value}
                      pinPending={pinPending.value}
                      mutePending={mutePending.value}
                      editing={editing.value}
                      draftName={draftName.value}
                      onUpdate:draftName={(value: string) => {
                        draftName.value = value
                      }}
                      onRenameStart={startRename}
                      onRenameConfirm={confirmRename}
                      onRenameCancel={cancelRename}
                      onPin={onPin}
                      onMute={onMute}
                      onMemberManage={openMemberSetting}
                      onExit={confirmExit}
                      onDisband={confirmDisband}
                    />
                  )
                  : null
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

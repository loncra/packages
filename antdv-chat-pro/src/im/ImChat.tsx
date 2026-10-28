import {computed, defineComponent, type PropType, ref} from 'vue'
import {ContactsOutlined, MessageOutlined} from '@antdv-next/icons'
import {Drawer, Empty, Flex, Segmented, Spin, Splitter, SplitterPanel} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {type RestResult} from '@loncra/client/commons'
import {
  type BasicUserChatConversation,
  ChatMessageService,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody,
} from '@loncra/client/message'
import type {PlatformUser} from '@loncra/client/auth'
import type {SystemUserContactItem} from '../system-user-panel'
import ImConversationList from './conversation/ImConversationList'
import ImContact from './contact/ImContact'
import ImChatView from './chat/ImChatView'
import {ImRoomSettings} from './room'
import type {ImPageHost} from './host'
import {useImChat} from './useImChat'
import {useImRoomActions} from './room/useImRoomActions'
import useStyle, {IM_CHAT_PREFIX} from './style'

export interface ImChatExpose {
  openConversation: (id: number, messageId?: number) => Promise<void>
  setRoomSettingsOpen: (open: boolean) => void
  applyIncomingMessage: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  applyMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  applyMessageUndo: (message: UserChatMessageEntity) => void
  addConversation: (conversation: UserChatConversationResponseBody) => Promise<void>
  refreshConversationByRoom: (roomId: number) => Promise<void>
  refreshConversations: () => Promise<void>
  refreshParticipants: (roomId: number) => Promise<void>
  scrollToBottom: () => void
}

const ImChat = defineComponent({
  name: 'LImChat',
  props: {
    host: {type: Object as PropType<ImPageHost>, required: true},
    contacts: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    loading: {type: Boolean, default: false},
  },
  emits: {
    active: (_conversation: UserChatConversationResponseBody | undefined) => true,
    muted: (_body: BasicUserChatConversation) => true,
  },
  setup(props, {emit, expose}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-chat', IM_CHAT_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const chat = useImChat({
      host: props.host,
      emitActive: (conversation) => emit('active', conversation),
    })
    const roomActions = useImRoomActions({conversations: chat.conversations})
    const contactLoading = ref(false)

    async function onContactSelected(user: PlatformUser) {
      contactLoading.value = true
      try {
        const result = await ChatMessageService.createConversation(
          {id: undefined, version: undefined},
          [user.systemName],
        )
        if (!result.data) {
          return
        }
        chat.conversations.upsertToTop(result.data)
        chat.pane.value = 'conversation'
        if (result.data.id != null) {
          await chat.openConversation(result.data.id)
        }
      } finally {
        contactLoading.value = false
      }
    }

    expose({
      openConversation: chat.openConversation,
      setRoomSettingsOpen: chat.setRoomSettingsOpen,
      applyIncomingMessage: chat.applyIncomingMessage,
      applyMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) =>
        chat.viewRef.value?.applyMessageUpdate(message),
      applyMessageUndo: (message: UserChatMessageEntity) => chat.viewRef.value?.applyMessageUndo(message),
      addConversation: chat.addConversation,
      refreshConversationByRoom: chat.refreshConversationByRoom,
      refreshConversations: chat.refreshConversations,
      refreshParticipants: chat.refreshParticipants,
      scrollToBottom: chat.scrollToBottom,
    } satisfies ImChatExpose)

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const activeKey = chat.session.item?.key
      return (
        <Splitter class={rootClass}>
          <SplitterPanel class={`${prefixCls.value}-side`} defaultSize="20%" min="15%" max="25%">
            <Spin spinning={props.loading || contactLoading.value} class={`${prefixCls.value}-full-spin`}>
              <Flex vertical class={`${prefixCls.value}-column`}>
                {chat.pane.value === 'conversation'
                  ? (
                    <ImConversationList
                      items={chat.conversations.sortedDataSource.value}
                      selectedKeys={activeKey ? [activeKey] : []}
                      openKeys={[]}
                      host={{
                        timeText: props.host.timeText,
                        unreadCount: props.host.unreadCount,
                        messagePreview: props.host.messagePreview,
                        draftPreview: props.host.draftPreview,
                      }}
                      storedDrafts={chat.drafts.storedDrafts}
                      actions={{
                        remove: (item) => {
                          chat.conversations.removeConversation(item, () => {
                            if (chat.session.item?.data?.id === item.id) {
                              chat.clearCurrent()
                            }
                          })
                        },
                        isFlagPending: (key, item) => chat.conversations.isFlagPending(key, Number(item.id)),
                        toggleFlag: chat.conversations.toggleFlag,
                      }}
                      onActive={(key: string, messageId?: number) => {
                        const found = chat.conversations.findById(Number(key))
                        const targetId = messageId ?? found?.mentions?.at(0)?.messageId
                        void chat.openConversation(Number(key), targetId)
                      }}
                    />
                  )
                  : (
                    <ImContact
                      dataSource={props.contacts}
                      onSelected={onContactSelected}
                    />
                  )}
                <div class={`${prefixCls.value}-switch`}>
                  <Segmented
                    value={chat.pane.value}
                    block
                    options={[
                      {value: 'conversation', icon: <MessageOutlined />},
                      {value: 'contact', icon: <ContactsOutlined />},
                    ]}
                    onChange={(key: string | number) => {
                      chat.pane.value = key === 'contact' ? 'contact' : 'conversation'
                    }}
                  />
                </div>
              </Flex>
            </Spin>
          </SplitterPanel>
          <SplitterPanel class={`${prefixCls.value}-main`}>
            {chat.session.item
              ? (
                <div class={`${prefixCls.value}-stage`}>
                  <Spin spinning={chat.session.loading} class={`${prefixCls.value}-full-spin`}>
                    <ImChatView
                      ref={chat.viewRef}
                      session={chat.session}
                      host={props.host}
                      showUnreadJump={chat.history.showReadableAnchorButton()}
                      onUnreadJump={() => chat.history.toReadableAnchor()}
                      moveToTop={(roomId: number | undefined, message: UserChatMessageResponseBody) => {
                        chat.conversations.moveToTopByRoomId(roomId, (item) => {
                          item.lastUserMessage = message
                        })
                      }}
                      onDraftSlots={chat.drafts.rememberDraft}
                    />
                  </Spin>
                  {chat.session.item.data
                    ? (
                      <Drawer
                        open={chat.session.drawerOpen}
                        placement="right"
                        getContainer={false}
                        closable={false}
                        mask={false}
                        onClose={() => {
                          chat.session.drawerOpen = false
                        }}
                      >
                        <div class={`${prefixCls.value}-drawer`}>
                          <ImRoomSettings
                            conversation={chat.session.item.data}
                            participants={chat.session.participants}
                            contacts={props.contacts}
                            host={props.host}
                            actions={roomActions}
                            conversations={chat.conversations}
                            onMuted={(body: BasicUserChatConversation) => emit('muted', body)}
                            onDelete={(body: UserChatConversationResponseBody) => {
                              chat.conversations.remove(body.id)
                              if (chat.session.item?.data?.id === body.id) {
                                chat.clearCurrent()
                              }
                            }}
                            onAdded={(result: RestResult<UserChatConversationResponseBody>) => {
                              if (result.data?.id != null) {
                                void chat.openConversation(result.data.id)
                              }
                            }}
                          />
                        </div>
                      </Drawer>
                    )
                    : null}
                </div>
              )
              : (
                <Flex class={`${prefixCls.value}-empty`} vertical justify="center" align="center">
                  <Empty />
                </Flex>
              )}
          </SplitterPanel>
        </Splitter>
      )
    }
  },
})

export default ImChat

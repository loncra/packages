import {computed, defineComponent, type PropType, reactive, ref} from 'vue'
import {ContactsOutlined, MessageOutlined} from '@antdv-next/icons'
import {Drawer, Empty, Flex, Segmented, Spin, Splitter, SplitterPanel} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, GLOBAL_PREFIX} from '@loncra/antdv'
import {isEnumValue, type RestResult} from '@loncra/client/commons'
import {
  type BasicUserChatConversation,
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
  MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody,
} from '@loncra/client/message'
import {CHAT_BUBBLE_TYPE} from '@loncra/client/ai'
import {appendMessages, type ChatRole, isPlaceholderDraft, type PersistableSlot} from '@loncra/chat-core'
import {draftDatabase} from '@loncra/chat-core/dexie'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {SystemUserContactItem} from '@loncra/antdv-pro'
import {useImConversations} from './conversation/useImConversations'
import ImConversationList from './conversation/ImConversationList'
import ImContact from './contact/ImContact'
import ImChatView, {type ImChatSession, type ImChatViewExpose} from './chat/ImChatView'
import {ImRoomSettings} from './room'
import {useImHistory} from './history/useImHistory'
import type {ImPageHost} from './host'
import {useLocale} from '../_util/useLocale'
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

function emptySession(): ImChatSession {
  return {
    item: undefined,
    loading: false,
    sending: false,
    readableAnchorLoading: false,
    isOnLastPage: false,
    isOnFirstPage: true,
    drawerOpen: false,
    participants: [],
    dataSource: {
      elements: [],
      first: true,
      last: true,
      number: 1,
      size: 10,
      metadata: {},
    },
  }
}

const ImChat = defineComponent({
  name: 'LIm',
  props: {
    host: {type: Object as PropType<ImPageHost>, required: true},
    contacts: {type: Array as PropType<SystemUserContactItem[]>, default: () => []},
    loading: {type: Boolean, default: false},
  },
  emits: ['active', 'muted', 'update:loading', 'update:contacts'],
  setup(props, {emit, expose}) {
    const locale = useLocale('ImChat')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-chat', IM_CHAT_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const conversations = useImConversations<UserChatConversationResponseBody>()
    const session = reactive(emptySession())
    const viewRef = ref<ImChatViewExpose>()

    function scrollToBottom() {
      viewRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    }

    const pane = ref<'conversation' | 'contact'>('conversation')
    const storedDrafts = reactive<Record<string, SlotConfigType[]>>({})
    const history = useImHistory(computed(() => session), {
      noMoreText: () => locale.value.noMore,
      nowUnix: () => Math.floor(Date.now() / 1000),
      readableSystemMessage: () => locale.value.unreadSystem,
      resolveRole: (message) => {
        const details = message.participant?.metadata?.details as {systemName?: string} | undefined
        let role: ChatRole = props.host.self.systemName === details?.systemName ? CHAT_BUBBLE_TYPE.USER : CHAT_BUBBLE_TYPE.AI
        if (isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
          role = CHAT_BUBBLE_TYPE.SYSTEM
        }
        return role
      },
      beforeSwitch: async () => {
        if (session.item?.data && viewRef.value) {
          const slots = viewRef.value.getSenderSlotConfigValue()
          session.item.data.draft = slots
          rememberDraft(session.item.data.room?.id, slots)
          await viewRef.value.persistSenderDraft()
        }
      },
      scrollToBottom,
      jumpToMessage: (key, flashPending, block) => {
        viewRef.value?.jumpToMessage(key, flashPending, block)
      },
    })

    function emitActive() {
      emit('active', session.item?.data)
    }

    async function openConversation(id: number, messageId?: number) {
      const found = conversations.findById(id)
      if (!found) {
        return
      }
      if (!Array.isArray(found.draft)) {
        found.draft = []
      }
      session.drawerOpen = false
      await history.switchConversation({
        key: String(found.id),
        data: found,
      }, messageId)
      emitActive()
    }

    function setRoomSettingsOpen(open: boolean) {
      session.drawerOpen = open
    }

    function messageRole(message: UserChatMessageResponseBody | UserChatMessageEntity): ChatRole {
      if (isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.USER)) {
        return CHAT_BUBBLE_TYPE.AI
      }
      if (isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
        return CHAT_BUBBLE_TYPE.SYSTEM
      }
      return message.principal === props.host.self.systemName ? CHAT_BUBBLE_TYPE.USER : CHAT_BUBBLE_TYPE.AI
    }

    function applyIncomingMessage(message: UserChatMessageResponseBody | UserChatMessageEntity) {
      if (
        message.principal === props.host.self.systemName
        && isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.USER)
      ) {
        return
      }
      if (session.item?.data?.room?.id === message.userChatRoomId && viewRef.value) {
        appendMessages(
          message,
          messageRole(message),
          session.dataSource.elements,
          false,
          !session.isOnFirstPage,
        )
      }
      conversations.moveToTopByRoomId(message.userChatRoomId, (item) => {
        item.lastUserMessage = message as UserChatMessageEntity
      })
    }

    async function addConversation(conversation: UserChatConversationResponseBody) {
      await props.host.refreshUnread()
      conversations.unshiftIfAbsent(conversation)
    }

    async function refreshConversationByRoom(roomId: number) {
      if (!conversations.findByRoomId(roomId)) {
        return
      }
      const found = await conversations.refreshByRoomId(roomId)
      if (!found || session.item?.data?.room?.id !== roomId) {
        return
      }
      session.item = {key: String(found.id), data: found}
      emitActive()
    }

    function previewSlot(slot: PersistableSlot): SlotConfigType {
      if (slot.type === 'text') {
        return {type: 'text', value: slot.value}
      }
      if (slot.slotKind === 'files') {
        return {
          type: 'custom',
          key: slot.key,
          props: {
            slotKind: 'files',
            defaultValue: slot.files.map((file) => ({
              uid: file.uid,
              name: file.name,
              size: file.size,
              type: file.type,
              response: file.response,
            })),
          },
        }
      }
      return {type: 'text', value: slot.value.value}
    }

    function rememberDraft(roomId: number | undefined, slots: SlotConfigType[]) {
      if (roomId == null) {
        return
      }
      const key = String(roomId)
      if (slots.length > 0 && !isPlaceholderDraft(slots)) {
        storedDrafts[key] = slots
        return
      }
      delete storedDrafts[key]
    }

    async function refreshConversations() {
      const currentId = session.item?.data?.id
      await conversations.load()
      const principal = props.host.self.systemName
      for (const key of Object.keys(storedDrafts)) {
        delete storedDrafts[key]
      }
      if (principal) {
        const rows = await draftDatabase.imDrafts.where('principal').equals(principal).toArray()
        for (const row of rows) {
          const slots: SlotConfigType[] = []
          for (const slot of row.slots) {
            slots.push(previewSlot(slot))
          }
          if (slots.length > 0) {
            storedDrafts[row.targetId] = slots
          }
        }
      }
      if (currentId != null) {
        await openConversation(currentId)
      }
    }

    async function refreshParticipants(roomId: number) {
      const current = session.item?.data
      if (!current || current.room?.id !== roomId) {
        return
      }
      if (!isEnumValue(current.status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED)) {
        return
      }
      await history.loadParticipant(roomId)
    }

    function clearCurrent() {
      session.item = undefined
      emit('active', undefined)
    }

    async function onContactSelected(conversation: UserChatConversationResponseBody) {
      conversations.upsertToTop(conversation)
      pane.value = 'conversation'
      if (conversation.id != null) {
        await openConversation(conversation.id)
      }
    }

    expose({
      openConversation,
      setRoomSettingsOpen,
      applyIncomingMessage,
      applyMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) =>
        viewRef.value?.applyMessageUpdate(message),
      applyMessageUndo: (message: UserChatMessageEntity) => viewRef.value?.applyMessageUndo(message),
      addConversation,
      refreshConversationByRoom,
      refreshConversations,
      refreshParticipants,
      scrollToBottom,
    } satisfies ImChatExpose)

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const activeKey = session.item?.key
      return (
        <Splitter class={rootClass}>
          <SplitterPanel class={`${prefixCls.value}-side`} defaultSize="20%" min="15%" max="25%">
            <Spin spinning={props.loading} class={`${GLOBAL_PREFIX}-full-spin`}>
              <Flex vertical class={`${prefixCls.value}-column`}>
                {pane.value === 'conversation'
                  ? (
                    <ImConversationList
                      items={conversations.sortedDataSource.value}
                      selectedKeys={activeKey ? [activeKey] : []}
                      openKeys={[]}
                      host={{
                        timeText: props.host.timeText,
                        unreadCount: props.host.unreadCount,
                        messagePreview: props.host.messagePreview,
                        draftPreview: props.host.draftPreview,
                      }}
                      storedDrafts={storedDrafts}
                      onActive={(key: string, messageId?: number) => {
                        const found = conversations.findById(Number(key))
                        const targetId = messageId ?? found?.mentions?.at(0)?.messageId
                        void openConversation(Number(key), targetId)
                      }}
                      onFlags={conversations.patchFlags}
                      onDelete={(item: UserChatConversationResponseBody) => {
                        conversations.remove(item.id)
                        if (session.item?.data?.id === item.id) {
                          clearCurrent()
                        }
                      }}
                    />
                  )
                  : (
                    <ImContact
                      dataSource={props.contacts}
                      loading={props.loading}
                      onUpdate:dataSource={(value: SystemUserContactItem[]) => emit('update:contacts', value)}
                      onUpdate:loading={(value: boolean) => emit('update:loading', value)}
                      onSelected={onContactSelected}
                    />
                  )}
                <div class={`${prefixCls.value}-switch`}>
                  <Segmented
                    value={pane.value}
                    block
                    options={[
                      {value: 'conversation', icon: <MessageOutlined />},
                      {value: 'contact', icon: <ContactsOutlined />},
                    ]}
                    onChange={(key: string | number) => {
                      pane.value = key === 'contact' ? 'contact' : 'conversation'
                    }}
                  />
                </div>
              </Flex>
            </Spin>
          </SplitterPanel>
          <SplitterPanel class={`${prefixCls.value}-main`}>
            {session.item
              ? (
                <div class={`${prefixCls.value}-stage`}>
                  <Spin spinning={session.loading} class={`${GLOBAL_PREFIX}-full-spin`}>
                    <ImChatView
                      ref={viewRef}
                      session={session}
                      host={props.host}
                      showUnreadJump={history.showReadableAnchorButton()}
                      onUnreadJump={() => history.toReadableAnchor()}
                      moveToTop={(roomId, message) => {
                        conversations.moveToTopByRoomId(roomId, (item) => {
                          item.lastUserMessage = message
                        })
                      }}
                      onDraftSlots={rememberDraft}
                    />
                  </Spin>
                  {session.item.data
                    ? (
                      <Drawer
                        open={session.drawerOpen}
                        placement="right"
                        getContainer={false}
                        closable={false}
                        mask={false}
                        onClose={() => {
                          session.drawerOpen = false
                        }}
                      >
                        <div class={`${prefixCls.value}-drawer`}>
                          <ImRoomSettings
                            conversation={session.item.data}
                            participants={session.participants}
                            contacts={props.contacts}
                            host={props.host}
                            onMuted={(body: BasicUserChatConversation) => emit('muted', body)}
                            onDelete={(body: UserChatConversationResponseBody) => {
                              conversations.remove(body.id)
                              if (session.item?.data?.id === body.id) {
                                clearCurrent()
                              }
                            }}
                            onAdded={(result: RestResult<UserChatConversationResponseBody>) => {
                              if (result.data?.id != null) {
                                void openConversation(result.data.id)
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

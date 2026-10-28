import {computed, defineComponent, nextTick, type PropType, ref} from 'vue'
import {Avatar, Button, Flex, Space, Typography} from 'antdv-next'
import {ToTopOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {UserAvatar} from '@loncra/antdv-pro'
import {classNames, fillLocale} from '@loncra/antdv'
import {type IdValueMetadata, isEnumValue} from '@loncra/client/commons'
import {
  ChatMessageService,
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
  MESSAGE_SERVER_USER_CHAT_ROOM_TYPE,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import {appendMessages, type ImChatBubble, type ImContentBlock} from '@loncra/chat-core'
import {CHAT_BUBBLE_TYPE} from '@loncra/client/ai'
import type {BubbleListHandle} from '../../bubble-list/createBubbleListExpose'
import type {ImHistorySession} from '../history/useImHistory'
import ImBubbleList from '../bubble/ImBubbleList'
import ImSender, {type ImSenderExpose} from '../sender/ImSender'
import ImCallButton from '../call/ImCallButton'
import type {ImPageHost} from '../host'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import {useImReadReport} from './useImReadReport'
import {useImMentionInstruction} from './useImMentionInstruction'
import useStyle, {IM_CHAT_VIEW_PREFIX} from './style'

export interface ImChatSession extends ImHistorySession<ImChatBubble> {
  sending: boolean
  item?: {
    key: string
    data?: UserChatConversationResponseBody
  }
}

export interface ImChatViewExpose {
  getScrollBox: () => HTMLElement | undefined
  jumpToMessage: (
    key: string,
    flashPending?: boolean,
    block?: ScrollLogicalPosition,
    behavior?: ScrollBehavior,
  ) => void
  scrollTo: (options: {
    key?: string | number
    top?: number | 'bottom' | 'top'
    behavior?: ScrollBehavior
    block?: ScrollLogicalPosition
  }) => void
  persistSenderDraft: () => Promise<void>
  getSenderSlotConfigValue: () => SlotConfigType[]
  applyMessageUpdate: (message: UserChatMessageResponseBody | UserChatMessageEntity) => void
  applyMessageUndo: (message: UserChatMessageEntity) => void
}

const ImChatView = defineComponent({
  name: 'LImChatView',
  props: {
    session: {type: Object as PropType<ImChatSession>, required: true},
    host: {type: Object as PropType<ImPageHost>, required: true},
    moveToTop: {
      type: Function as PropType<(roomId: number | undefined, message: UserChatMessageResponseBody) => void>,
      required: true,
    },
    showUnreadJump: {type: Boolean, default: false},
    onUnreadJump: {type: Function as PropType<() => void>, required: true},
    onDraftSlots: {
      type: Function as PropType<(roomId: number | undefined, slots: SlotConfigType[]) => void>,
      required: true,
    },
  },
  setup(props, {expose}) {
    const locale = useLocale('ImChat')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-chat-view', IM_CHAT_VIEW_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const senderRef = ref<ImSenderExpose>()
    const listRef = ref<BubbleListHandle>()
    const refMessages = ref<UserChatMessageResponseBody[]>([])
    const {onVisibleItems} = useImReadReport({session: props.session, host: props.host})
    const {instructionMap, onSenderInsertInstruction, onInstructionFilter} = useImMentionInstruction({
      session: props.session,
      senderRef,
      host: props.host,
    })

    function applyMessageUpdate(message: UserChatMessageResponseBody | UserChatMessageEntity) {
      const elements = props.session.dataSource.elements
      const index = elements.findIndex((bubble) => bubble?.id === message.id)
      if (index < 0) {
        return
      }
      const bubble = elements[index]
      if (!bubble) {
        return
      }
      Object.assign(bubble, message)
      bubble.key = String(message.id)
    }

    function applyMessageUndo(message: UserChatMessageEntity) {
      const elements = props.session.dataSource.elements
      const index = elements.findIndex((bubble) => bubble?.id === message.id)
      if (index < 0) {
        return
      }
      const bubble = elements[index]
      if (!bubble || !('undo' in bubble)) {
        return
      }
      bubble.undo = message.undo
      bubble.undoTime = message.undoTime
      bubble.metadata = {oldContent: bubble.content}
      bubble.content = [{
        type: 'custom',
        slotKind: 'undo',
        value: locale.value.undoMessage,
        tooltip: fillLocale(locale.value.undoTime, {
          time: `:${props.host.timeText(bubble.undoTime)}`,
        }),
      }]
    }

    function placeholder(): string {
      const status = props.session.item?.data?.status
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.EXIST)) {
        return locale.value.exitRoom
      }
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.REMOVE)) {
        return locale.value.roomRemove
      }
      if (isEnumValue(status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.DISBAND)) {
        return locale.value.disbandRoom
      }
      return locale.value.inputPlaceholder
    }

    async function onSubmit(content: ImContentBlock[]) {
      const data = props.session.item?.data
      const roomId = data?.room?.id
      if (!roomId || !props.session.item) {
        return
      }
      props.session.sending = true
      try {
        const result = await ChatMessageService.send(content, String(roomId))
        if (!result.data) {
          return
        }
        appendMessages(result.data, CHAT_BUBBLE_TYPE.USER, props.session.dataSource.elements)
        await senderRef.value?.clearStored()
        senderRef.value?.clear()
        props.moveToTop(result.data.userChatRoomId, result.data)
        if (props.session.item?.data) {
          props.session.item.data.draft = []
        }
        props.onDraftSlots(roomId, [])
        await nextTick()
        listRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      } finally {
        props.session.sending = false
      }
    }

    function onReedit(bubble: ImChatBubble) {
      props.session.dataSource.elements = props.session.dataSource.elements.filter(
        (row) => row.key !== String(bubble.id),
      )
      const content = (bubble.metadata as {oldContent?: unknown} | undefined)?.oldContent
      if (!Array.isArray(content) || !senderRef.value || !props.session.item?.data) {
        return
      }
      const slots = senderRef.value.convertContentBlockToSlotConfig(content as ImContentBlock[])
      props.session.item.data.draft = slots
      props.onDraftSlots(props.session.item.data.room?.id, slots)
    }

    function onReference(message: UserChatMessageResponseBody) {
      if (refMessages.value.some((item) => item.id === message.id)) {
        return
      }
      refMessages.value = [...refMessages.value, message]
    }

    expose({
      getScrollBox: () => listRef.value?.getScrollBox(),
      jumpToMessage: (
        key: string,
        flashPending?: boolean,
        block?: ScrollLogicalPosition,
        behavior?: ScrollBehavior,
      ) => listRef.value?.jumpToMessage(key, flashPending, block, behavior),
      scrollTo: (options) => listRef.value?.scrollTo(options),
      persistSenderDraft: () => senderRef.value?.flush() ?? Promise.resolve(),
      getSenderSlotConfigValue: () => senderRef.value?.getSlotConfigValue() ?? [],
      applyMessageUpdate,
      applyMessageUndo,
    } satisfies ImChatViewExpose)

    return () => {
      const data = props.session.item?.data
      const roomId = data?.room?.id
      const privateRoom = isEnumValue(data?.room?.type, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.PRIVATE_CHAT)
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      return (
        <Flex vertical class={rootClass}>
          <ImBubbleList
            ref={listRef}
            session={props.session}
            host={props.host}
            roomType={data?.room?.type}
            onVisibleItems={onVisibleItems}
            onReedit={onReedit}
            onReference={onReference}
            v-slots={{
              bubbleListAfter: () => props.showUnreadJump
                ? (
                  <Button
                    class={`${prefixCls.value}-jump`}
                    onClick={() => props.onUnreadJump()}
                    v-slots={{icon: () => <ToTopOutlined />}}
                  >
                    {locale.value.jumpToUnread}
                  </Button>
                )
                : null,
            }}
          />
          <div class={`${prefixCls.value}-footer`}>
            {data
              ? (
                <ImSender
                  ref={senderRef}
                  key={String(roomId ?? props.session.item?.key)}
                  host={props.host}
                  targetId={String(roomId ?? '')}
                  slotConfig={data.draft}
                  refMessages={refMessages.value}
                  onUpdate:refMessages={(next: UserChatMessageResponseBody[]) => {
                    refMessages.value = next
                  }}
                  instructionMap={instructionMap()}
                  sending={props.session.sending}
                  uploadOptions={roomId ? {param: {prefix: props.host.roomUploadPrefix(roomId)}} : undefined}
                  placeholder={placeholder()}
                  disabled={!isEnumValue(data.status, MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS.ENABLED)}
                  senderInsertInstruction={onSenderInsertInstruction}
                  onFilterDataSource={onInstructionFilter}
                  onSubmit={onSubmit}
                  onJumpToReference={(message: UserChatMessageResponseBody) =>
                    listRef.value?.jumpToMessage(String(message.id))
                  }
                  onAppliedSlots={(slots: SlotConfigType[]) => {
                    if (props.session.item?.data) {
                      props.session.item.data.draft = slots
                    }
                    props.onDraftSlots(props.session.item?.data?.room?.id, slots)
                  }}
                  v-slots={{
                    instructionItemRender: ({item, prefix}: {item: IdValueMetadata<string, string>; prefix: string}) => {
                      if (prefix !== '@') {
                        return null
                      }
                      const participant = item.metadata as unknown as UserChatParticipantEntity | undefined
                      const details = participant?.metadata?.details
                      if (details) {
                        return (
                          <Space>
                            <UserAvatar user={details} />
                            <Typography.Text ellipsis={{tooltip: AuthServerService.getPrincipalNameByUserDetails(details)}}>
                              {AuthServerService.getPrincipalNameByUserDetails(details)}
                            </Typography.Text>
                          </Space>
                        )
                      }
                      return (
                        <Space>
                          <Avatar>{item.value.substring(0, 1)}</Avatar>
                          <Typography.Text>{item.value}</Typography.Text>
                        </Space>
                      )
                    },
                    leftExtra: () => privateRoom
                      ? (
                        <ImCallButton
                          type="text"
                          roomId={Number(roomId)}
                          peerName={data?.name ?? ''}
                          principals={props.session.participants.map((participant) => participant.principal)}
                        />
                      )
                      : null,
                  }}
                />
              )
              : null}
          </div>
        </Flex>
      )
    }
  },
})

export default ImChatView

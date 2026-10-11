import {computed, defineComponent, nextTick, type PropType, ref, watch} from 'vue'
import {Avatar, Button, Flex, Space, Typography} from 'antdv-next'
import {ToTopOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionMeasure, InstructionSenderHandle} from '@loncra/antdv-chat'
import {UserAvatar} from '@loncra/antdv-pro'
import {classNames, fillLocale} from '@loncra/antdv'
import {isEnumValue, type IdValueMetadata, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {
  CHAT_EVERYONE_ID,
  ChatMessageService,
  MESSAGE_SERVER_USER_CHAT_CONVERSATION_STATUS,
  MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE,
  MESSAGE_SERVER_USER_CHAT_ROOM_TYPE,
  type UserChatConversationResponseBody,
  type UserChatMessageEntity,
  type UserChatMessageResponseBody,
  type UserChatParticipantEntity,
} from '@loncra/client/message'
import {appendMessages, type ImChatBubble, type ImContentBlock} from '@loncra/chat-core'
import {sendImMessage} from '../send/sendImMessage'
import type {BubbleListItem} from '../../bubble-list/types'
import type {ImHistorySession} from '../history/useImHistory'
import ImBubbleList from '../bubble/ImBubbleList'
import ImSender, {type ImSenderExpose} from '../sender/ImSender'
import ImCallButton from '../call/ImCallButton'
import type {ImPageHost} from '../host'
import {useLocale} from '../../_util/useLocale'
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
  emits: ['jumpToReference'],
  setup(props, {expose}) {
    const locale = useLocale('ImChat')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('im-chat-view', IM_CHAT_VIEW_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const senderRef = ref<ImSenderExpose>()
    const listRef = ref<{
      getScrollBox: () => HTMLElement | undefined
      jumpToMessage: ImChatViewExpose['jumpToMessage']
      scrollTo: ImChatViewExpose['scrollTo']
    }>()
    const refMessages = ref<UserChatMessageResponseBody[]>([])
    const readingSet = new Set<number>()
    const sentIds = new Set<number>()
    let readProcessing = false

    function isReadableMessage(message: UserChatMessageResponseBody | UserChatMessageEntity | undefined): boolean {
      if (!message || isEnumValue(message.type, MESSAGE_SERVER_USER_CHAT_MESSAGE_TYPE.SYSTEM)) {
        return false
      }
      const readable = (message as UserChatMessageResponseBody).readable
      if (readable === undefined) {
        return false
      }
      return isEnumValue(readable, YES_OR_NO_TYPE.YES) && message.principal !== props.host.selfName
    }

    async function flushReadQueue(): Promise<void> {
      if (readProcessing || readingSet.size === 0) {
        return
      }
      readProcessing = true
      try {
        while (readingSet.size > 0) {
          const batch = Array.from(readingSet)
          readingSet.clear()
          try {
            await ChatMessageService.readMessage(batch)
            batch.forEach((id) => sentIds.add(id))
            await props.host.refreshUnread()
          } catch (error) {
            console.error('标记已读失败:', error)
            break
          }
        }
      } finally {
        readProcessing = false
      }
    }

    function markVisible(items: BubbleListItem[]) {
      if (items.length <= 0) {
        return
      }
      for (const item of items) {
        if (!('readable' in item) || !('id' in item) || item.id == null) {
          continue
        }
        const id = Number(item.id)
        if (!sentIds.has(id)) {
          readingSet.add(id)
        }
        const metadata = props.session.dataSource?.metadata as {readableAnchorId?: number} | undefined
        if (id === metadata?.readableAnchorId) {
          delete metadata.readableAnchorId
        }
      }
      void flushReadQueue()
    }

    function onVisibleItems(items: BubbleListItem[]) {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) {
        return
      }
      markVisible(items.filter((item) =>
        'readable' in item && isReadableMessage(item as unknown as UserChatMessageResponseBody),
      ))
    }

    watch(() => props.session.item?.key, () => {
      readingSet.clear()
      sentIds.clear()
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

    function instructionMap(): Record<string, IdValueMetadata<string, string>[]> | undefined {
      const roomType = props.session.item?.data?.room?.type
      if (isEnumValue(roomType, MESSAGE_SERVER_USER_CHAT_ROOM_TYPE.PRIVATE_CHAT)) {
        return undefined
      }
      const people = props.session.participants
        .filter((participant) => participant.principal !== props.host.selfName)
        .map((participant) => ({
          id: participant.principal,
          value: props.host.principalName(participant.metadata.details),
          metadata: participant as unknown as Record<string, unknown>,
        }))
      return {
        '@': [
          ...people,
          {id: CHAT_EVERYONE_ID, value: locale.value.everyone},
        ],
      }
    }

    function stripMentions(slots: SlotConfigType[]): SlotConfigType[] {
      return slots.filter((slot) => !(slot.type === 'custom' && slot.props?.slotKind === 'instruction'))
    }

    function removeTrailingTrigger(slots: SlotConfigType[], trigger: string): SlotConfigType[] {
      if (!trigger) {
        return slots
      }
      const result = slots.map((slot) => ({...slot}))
      for (let index = result.length - 1; index >= 0; index -= 1) {
        const slot = result[index]
        if (slot?.type !== 'text' || typeof slot.value !== 'string' || !slot.value.endsWith(trigger)) {
          if (slot?.type === 'text') {
            break
          }
          continue
        }
        const next = slot.value.slice(0, -trigger.length)
        if (next === '') {
          result.splice(index, 1)
        } else {
          result[index] = {...slot, value: next}
        }
        break
      }
      return result
    }

    function onSenderInsertInstruction(sender: InstructionSenderHandle, block: object, measure: InstructionMeasure) {
      const slotProps = (block as unknown as {
        props?: {prefix?: string; defaultValue?: IdValueMetadata<string, string>}
      }).props
      if (slotProps?.prefix === '@' && slotProps.defaultValue?.id === CHAT_EVERYONE_ID) {
        const trigger = measure.prefix + measure.keyword
        const kept = stripMentions((sender.getValue().slotConfig ?? []) as SlotConfigType[])
        sender.clear()
        sender.insert([block, {type: 'text', value: ' '}, ...removeTrailingTrigger(kept, trigger)], 'start')
        return
      }
      sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
    }

    function onInstructionFilter(keyword: string, dataSource: IdValueMetadata<string, string>[], prefix: string) {
      if (prefix !== '@' || !senderRef.value) {
        return dataSource
      }
      const existIds = (senderRef.value.getSlotConfigValue() ?? [])
        .filter((slot) => slot.type === 'custom' && slot.props?.slotKind === 'instruction')
        .map((slot) => slot.type === 'custom' ? slot.props?.defaultValue?.id : undefined)
      if (existIds.includes(CHAT_EVERYONE_ID)) {
        return []
      }
      const absent = dataSource.filter((item) => !existIds.includes(item.id))
      if (absent.length === 1 && absent.at(-1)?.id === CHAT_EVERYONE_ID) {
        return []
      }
      const matches = (text: string) => keyword === '' || text.includes(keyword)
      return [
        ...absent.filter((item) => item.id === CHAT_EVERYONE_ID && matches(item.value)),
        ...absent.filter((item) => {
          const participant = item.metadata as unknown as UserChatParticipantEntity | undefined
          return participant?.metadata?.details
            && matches(props.host.principalName(participant.metadata.details))
        }),
      ]
    }

    async function onSubmit(content: ImContentBlock[]) {
      const data = props.session.item?.data
      const roomId = data?.room?.id
      if (!roomId || !props.session.item) {
        return
      }
      props.session.sending = true
      try {
        const result = await sendImMessage(String(roomId), content)
        if (!result.data) {
          return
        }
        appendMessages(result.data, 'user', props.session.dataSource.elements)
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

    function onReedit(content: unknown) {
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
                  uploadOptions={roomId ? {param: {prefix: `user_chat_room/${roomId}`}} : undefined}
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
                            <Typography.Text ellipsis={{tooltip: props.host.principalName(details)}}>
                              {props.host.principalName(details)}
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

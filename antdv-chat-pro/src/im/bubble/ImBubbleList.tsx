import {defineComponent, inject, ref, type PropType} from 'vue'
import {UserAvatar} from '@loncra/antdv-pro'
import {textBubble, type ImChatBubble, type ImContentBlock} from '@loncra/chat-core'
import BubbleList from '../../bubble-list/BubbleList.tsx'
import type {BubbleListExpose, BubbleListItem, BubbleRenderRow, BubbleSession} from '../../bubble-list/types.ts'
import {isEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import ImBubbleContent from './ImBubbleContent.tsx'
import ImBubbleFooter from './ImBubbleFooter.tsx'
import ImBubbleHeader from './ImBubbleHeader.tsx'
import ImBubbleRead from './ImBubbleRead.tsx'
import type {ImChatHost} from '../host.ts'
import {IM_HISTORY_KEY} from '../history/useImHistory.ts'

const TIME_DIVIDER_GAP_MS = 5 * 60 * 1000

function messageTime(item: {creationTime?: number}): number {
  return item.creationTime ?? 0
}

const ImBubbleList = defineComponent({
  name: 'LImBubbleList',
  props: {
    session: {type: Object as PropType<BubbleSession>, required: true},
    host: {type: Object as PropType<ImChatHost>, required: true},
    roomType: {
      type: [Number, Object] as PropType<number | NameValueEnumMetadata<number>>,
      default: undefined,
    },
  },
  emits: ['visibleItems', 'reedit', 'reference'],
  setup(props, {emit, slots, expose}) {
    const history = inject(IM_HISTORY_KEY, null)
    const listRef = ref<BubbleListExpose>()

    expose({
      getScrollBox: () => listRef.value?.getScrollBox(),
      jumpToMessage: (
        key: string,
        flashPending?: boolean,
        block?: ScrollLogicalPosition,
        behavior?: ScrollBehavior,
      ) => listRef.value?.jumpToMessage(key, flashPending, block, behavior),
      scrollTo: (options: {
        key?: string | number
        top?: number | 'bottom' | 'top'
        behavior?: ScrollBehavior
        block?: ScrollLogicalPosition
      }) => listRef.value?.scrollTo(options),
    })

    function renderItem(messages: BubbleListItem[]): BubbleRenderRow[] {
      const sorted = [...messages.filter((item) => !item.hide)].sort(
        (a, b) => messageTime(a) - messageTime(b),
      )
      const result: BubbleRenderRow[] = []
      let lastDividerTime = 0
      for (const msg of sorted) {
        const msgTime = messageTime(msg)
        const needDivider = result.length === 0
          || (msgTime > 0 && msgTime - lastDividerTime >= TIME_DIVIDER_GAP_MS)
        if (needDivider && msgTime > 0) {
          result.push({
            bubble: textBubble(
              `divider-${String(msg.key)}-${msgTime}`,
              props.host.timeText(msgTime),
              'divider',
            ),
          })
          lastDividerTime = msgTime
        }
        result.push({bubble: msg})
      }
      return result
    }

    function asBubble(item: BubbleListItem): ImChatBubble | undefined {
      if (!('undo' in item)) {
        return undefined
      }
      return item as ImChatBubble
    }

    return () => (
      <BubbleList
        ref={listRef}
        session={props.session}
        collectVisible
        renderItem={renderItem}
        onVisibleItems={(items: BubbleListItem[]) => emit('visibleItems', items)}
        onLoadPage={(tag: 'next' | 'previous') => {
          void history?.loadMore(tag)
        }}
        v-slots={{
          avatar: ({item}: {item: BubbleListItem}) => {
            const bubble = asBubble(item)
            return (
              <UserAvatar
                user={bubble?.participant?.metadata?.details}
                {...({size: 'large'} as Record<string, unknown>)}
              />
            )
          },
          header: ({item}: {item: BubbleListItem}) => {
            const bubble = asBubble(item)
            if (!bubble) {
              return null
            }
            return (
              <ImBubbleHeader
                role={bubble.role}
                roomType={props.roomType}
                details={bubble.participant?.metadata?.details}
                principalName={props.host.principalName}
              />
            )
          },
          contentRender: ({item}: {item: BubbleListItem}) => {
            const bubble = asBubble(item)
            if (!bubble || (bubble.role !== 'user' && bubble.role !== 'ai')) {
              return null
            }
            return (
              <ImBubbleContent
                content={bubble.content as ImContentBlock[]}
                principal={bubble.principal}
                host={props.host}
                onJump={(message) => listRef.value?.jumpToMessage(String(message.id))}
                onReedit={() => {
                  props.session.dataSource.elements = props.session.dataSource.elements.filter(
                    (row) => row.key !== String(bubble.id),
                  )
                  emit('reedit', (bubble.metadata as {oldContent?: unknown} | undefined)?.oldContent)
                }}
                v-slots={{call: slots.call}}
              />
            )
          },
          footer: ({item}: {item: BubbleListItem}) => {
            const bubble = asBubble(item)
            if (!bubble || bubble.id == null || (bubble.role !== 'user' && bubble.role !== 'ai')) {
              return null
            }
            return (
              <ImBubbleFooter
                undo={bubble.undo}
                role={bubble.role}
                undoableTime={bubble.undoableTime}
                messageId={Number(bubble.id)}
                onReference={() => emit('reference', bubble)}
                v-slots={{
                  default: () => (
                    <ImBubbleRead item={bubble} roomType={props.roomType} host={props.host} />
                  ),
                }}
              />
            )
          },
          bubbleListAfter: () => slots.bubbleListAfter?.(),
        }}
      />
    )
  },
})

export default ImBubbleList

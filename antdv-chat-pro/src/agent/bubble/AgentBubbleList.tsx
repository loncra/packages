import {defineComponent, inject, ref, type PropType} from 'vue'
import type {RoleType} from '@antdv-next/x/dist/bubble/interface'
import {UserAvatar} from '@loncra/antdv-pro'
import type {PlatformUser, UserMetadata} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'
import {STREAM_RUNNING_STATUS_VALUE} from '@loncra/client/ai'
import BubbleList from '../../bubble-list/BubbleList.tsx'
import {DEFAULT_BUBBLE_LIST_ROLE} from '../../bubble-list/useBubbleList.ts'
import type {BubbleListExpose, BubbleListItem, BubbleSession} from '../../bubble-list/types.ts'
import AgentAssistantContent from './AgentAssistantContent.tsx'
import AgentBubbleFooter from './AgentBubbleFooter.tsx'
import AgentUserContent from './AgentUserContent.tsx'
import {AGENT_HISTORY_KEY} from '../history/useAgentHistory.ts'

function isLoading(item: BubbleListItem): boolean {
  if (!('status' in item)) {
    return false
  }
  const status = (item as BubbleListItem & {status?: unknown}).status
  if (status == null) {
    return false
  }
  return STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(status as number))
}

const role = {
  ...DEFAULT_BUBBLE_LIST_ROLE,
  ai: (data: BubbleListItem) => {
    const isContentEmpty = !data.content || data.content.length <= 0
    const isRunning = isLoading(data)
    return {
      ...DEFAULT_BUBBLE_LIST_ROLE.ai,
      variant: 'borderless',
      shape: 'round',
      loading: isContentEmpty && isRunning,
    }
  },
} as RoleType

const AgentBubbleList = defineComponent({
  name: 'LAgentBubbleList',
  props: {
    session: {type: Object as PropType<BubbleSession>, required: true},
    user: {
      type: Object as PropType<PlatformUser | UserMetadata>,
      default: undefined,
    },
  },
  emits: ['resume'],
  setup(props, {emit, slots, expose}) {
    const history = inject(AGENT_HISTORY_KEY, null)
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

    return () => (
      <BubbleList
        ref={listRef}
        session={props.session}
        role={role}
        isLoading={isLoading}
        onLoadPage={(tag: 'next' | 'previous') => {
          void history?.loadMore(tag)
        }}
        v-slots={{
          avatar: ({item}: {item: BubbleListItem}) => {
            if (item.role === 'user') {
              return <UserAvatar user={props.user} {...({size: 'large'} as Record<string, unknown>)} />
            }
            return slots.assistantAvatar?.()
          },
          contentRender: ({item}: {item: BubbleListItem}) => {
            if (item.role === 'ai') {
              return (
                <AgentAssistantContent
                  item={item as unknown as {key: string | number; content: never[]}}
                  onResume={(id: number) => emit('resume', id)}
                />
              )
            }
            return <AgentUserContent item={item} />
          },
          footer: ({item}: {item: BubbleListItem}) => (
            <AgentBubbleFooter item={item as unknown as {role: string}} />
          ),
          bubbleListAfter: () => slots.bubbleListAfter?.(),
        }}
      />
    )
  },
})

export default AgentBubbleList

import {computed, defineComponent, nextTick, type PropType, ref, watch} from 'vue'
import {Card} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {Think} from '@antdv-next/x'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'
import {useLocale} from '../../_util/useLocale'
import {AGENT_BUBBLE_PREFIX} from './style/index'
import {isBlockRunning, markdownAttrs} from './useAgentAssistantContent'
import type {AgentThinkBlock as AgentThinkBlockData} from '@loncra/chat-core'

const NEAR_BOTTOM_PX = 40

const AgentThinkBlock = defineComponent({
  name: 'LAgentThinkBlock',
  props: {
    block: {type: Object as PropType<AgentThinkBlockData>, required: true},
  },
  setup(props) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))
    const bodyRef = ref<HTMLDivElement>()

    watch(
      () => props.block.value,
      async () => {
        await nextTick()
        const scroller = bodyRef.value?.querySelector(`.${prefixCls.value}-markdown`) as HTMLElement | null
        if (!scroller) {
          return
        }
        const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
        if (distance <= NEAR_BOTTOM_PX) {
          scroller.scrollTop = scroller.scrollHeight
        }
      },
    )

    return () => (
      <Card class={`${prefixCls.value}-think`}>
        <Think
          title={locale.value.think}
          defaultExpanded={false}
          expanded={props.block.expanded}
          onUpdate:expanded={(value: boolean) => {
            props.block.expanded = value
          }}
          blink={isBlockRunning(props.block)}
          loading={isBlockRunning(props.block)}
        >
          <div ref={bodyRef}>
            <Markdown
              {...markdownAttrs({
                content: props.block.value ?? '',
                components: {code: MarkdownCodeRenderer},
                paragraphTag: 'div',
                streaming: {hasNextChunk: isBlockRunning(props.block)},
                openLinksInNewTab: true,
                class: `${prefixCls.value}-markdown`,
              })}
            />
          </div>
        </Think>
      </Card>
    )
  },
})

export default AgentThinkBlock

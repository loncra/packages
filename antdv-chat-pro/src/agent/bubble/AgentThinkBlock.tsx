import {computed, defineComponent, type PropType} from 'vue'
import {Card} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {Think} from '@antdv-next/x'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'
import {useLocale} from '../../_util/useLocale'
import {AGENT_BUBBLE_PREFIX} from './style/index'
import {isBlockRunning, markdownAttrs} from './useAgentAssistantContent'
import type {AgentThinkBlock as AgentThinkBlockData} from '@loncra/chat-core'

const AgentThinkBlock = defineComponent({
  name: 'LAgentThinkBlock',
  props: {
    block: {type: Object as PropType<AgentThinkBlockData>, required: true},
  },
  setup(props) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))

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
          <div class={`${prefixCls.value}-scroll`}>
            <Markdown
              {...markdownAttrs({
                content: props.block.value ?? '',
                components: {code: MarkdownCodeRenderer},
                paragraphTag: 'div',
                streaming: {hasNextChunk: isBlockRunning(props.block)},
                openLinksInNewTab: true,
              })}
            />
          </div>
        </Think>
      </Card>
    )
  },
})

export default AgentThinkBlock

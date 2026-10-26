import {computed, defineComponent, type PropType} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {Bubble} from '@antdv-next/x'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'
import {AGENT_BUBBLE_PREFIX} from './style/index'
import {isBlockRunning, markdownAttrs} from './useAgentAssistantContent'
import type {AgentAnswerBlock as AgentAnswerBlockData} from '@loncra/chat-core'

const AgentAnswerBlock = defineComponent({
  name: 'LAgentAnswerBlock',
  props: {
    block: {type: Object as PropType<AgentAnswerBlockData>, required: true},
  },
  setup(props) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))

    return () => (
      <Bubble
        content=" "
        class={`${prefixCls.value}-answer`}
        v-slots={{
          content: () => (
            <Markdown
              {...markdownAttrs({
                content: props.block.value ?? '',
                components: {code: MarkdownCodeRenderer},
                paragraphTag: 'div',
                streaming: {hasNextChunk: isBlockRunning(props.block)},
                openLinksInNewTab: true,
              })}
            />
          ),
        }}
      />
    )
  },
})

export default AgentAnswerBlock

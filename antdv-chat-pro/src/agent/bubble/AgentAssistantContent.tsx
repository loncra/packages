import {computed, defineComponent, Fragment, type PropType} from 'vue'
import {Alert, Flex} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {STREAM_RUNNING_STATUS_VALUE} from '@loncra/client/ai'
import useStyle, {AGENT_BUBBLE_PREFIX} from './style/index'
import {useAgentAssistantContent} from './useAgentAssistantContent'
import AgentAnswerBlock from './AgentAnswerBlock'
import AgentThinkBlock from './AgentThinkBlock'
import AgentToolCallCard from './AgentToolCallCard'
import type {AgentAssistantItem} from './types'

const AgentAssistantContent = defineComponent({
  name: 'LAgentAssistantContent',
  props: {
    item: {
      type: Object as PropType<AgentAssistantItem>,
      required: true,
    },
    onResume: {
      type: Function as PropType<(assistantMessageId: number) => void>,
      required: true,
    },
  },
  setup(props) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const {
      toggleToolCallExpanded,
      clickToolConfirmed,
      clickAllToolConfirmed,
      toolCallExpandedState,
      groupedBlocks,
      hasContent,
    } = useAgentAssistantContent(props.item, (id) => props.onResume(id))

    return () => {
      if (hasContent()) {
        return (
          <div class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
            <Flex vertical gap="small">
              {groupedBlocks.value.map((group) => (
                <Fragment key={group.groupId}>
                  {group.thinkBlock ? <AgentThinkBlock block={group.thinkBlock} /> : null}
                  {group.answerBlock ? <AgentAnswerBlock block={group.answerBlock} /> : null}
                  {group.toolBlocks.length > 0
                    ? (
                      <AgentToolCallCard
                        group={group}
                        expanded={toolCallExpandedState.value[group.groupId] ?? false}
                        onToggle={() => toggleToolCallExpanded(group.groupId)}
                        onDecide={(tool, confirmed) => void clickToolConfirmed(tool, confirmed)}
                        onDecideAll={(tools, confirmed) => void clickAllToolConfirmed(tools, confirmed)}
                      />
                    )
                    : null}
                  {group.errorBlock
                    ? (
                      <Alert
                        type="error"
                        showIcon
                        message={group.errorBlock.value || group.errorBlock.metadata?.message || ''}
                      />
                    )
                    : null}
                </Fragment>
              ))}
            </Flex>
          </div>
        )
      }
      if (props.item.status != null && STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(props.item.status))) {
        return (
          <span class="antd-bubble-dot">
            <i class="antd-bubble-dot-item" />
            <i class="antd-bubble-dot-item" />
            <i class="antd-bubble-dot-item" />
          </span>
        )
      }
      return (
        <Alert
          type="warning"
          showIcon
          message={props.item.status == null ? '' : getEnumName(props.item.status)}
        />
      )
    }
  },
})

export default AgentAssistantContent

import {computed, defineComponent, type PropType} from 'vue'
import {Alert, Avatar, Button, Card, Flex, Popover, Space, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {Bubble, Sources, Think, ThoughtChain} from '@antdv-next/x'
import {CheckOutlined, CloseOutlined, CodeOutlined, RightOutlined} from '@antdv-next/icons'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'
import type {AgentToolCallBlock} from '@loncra/chat-core'
import {getEnumName, getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {AI_SERVER_AGENT_TOOL_BLOCK_STATUS, STREAM_RUNNING_STATUS_VALUE} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {AGENT_BUBBLE_PREFIX} from './style/index.ts'
import {
  findToolConfirmedItem,
  getTavilyExtractResult,
  getTavilySearchSourceConfig,
  hasToolConfirmed,
  isBlockRunning,
  useAgentAssistantContent,
} from './useAgentAssistantContent.ts'
import type {ThoughtChainItemDataType} from './types.ts'

function markdownAttrs(extra: Record<string, unknown>): Record<string, unknown> {
  return extra
}

const AgentAssistantContent = defineComponent({
  name: 'LAgentAssistantContent',
  props: {
    item: {
      type: Object as PropType<{
        key: string | number
        content: Parameters<typeof useAgentAssistantContent>[0]['content']
        status?: NameValueEnumMetadata<number> | number
      }>,
      required: true,
    },
    onResume: {
      type: Function as PropType<(assistantMessageId: number) => void>,
      required: true,
    },
  },
  setup(props) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const {
      toggleToolCallExpanded,
      clickAllToolConfirmed,
      clickToolConfirmed,
      toolCallExpandedState,
      groupedBlocks,
      hasContent,
      toThoughtChainItem,
    } = useAgentAssistantContent(props.item, (id) => props.onResume(id))

    function chainItem(slot: {item: {data?: AgentToolCallBlock; title?: unknown; status?: string}}): ThoughtChainItemDataType {
      return slot.item as ThoughtChainItemDataType
    }

    return () => {
      if (hasContent()) {
        return (
          <div class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
          <Flex vertical gap="small">
            {groupedBlocks.value.map((group) => (
              <div key={group.groupId}>
                {group.thinkBlock
                  ? (
                    <Card class={`${prefixCls.value}-think`}>
                      <Think
                        title={locale.value.think}
                        defaultExpanded={false}
                        expanded={group.thinkBlock.expanded}
                        onUpdate:expanded={(value: boolean) => {
                          if (group.thinkBlock) {
                            group.thinkBlock.expanded = value
                          }
                        }}
                        blink={isBlockRunning(group.thinkBlock)}
                        loading={isBlockRunning(group.thinkBlock)}
                      >
                        <div class={`${prefixCls.value}-scroll`}>
                        <Markdown
                          {...markdownAttrs({
                            content: group.thinkBlock.value ?? '',
                            components: {code: MarkdownCodeRenderer},
                            paragraphTag: 'div',
                            streaming: {hasNextChunk: isBlockRunning(group.thinkBlock)},
                            openLinksInNewTab: true,
                          })}
                        />
                        </div>
                      </Think>
                    </Card>
                  )
                  : null}
                {group.answerBlock
                  ? (
                    <Bubble
                      content=" "
                      v-slots={{
                        content: () => (
                          <Markdown
                            {...markdownAttrs({
                              content: group.answerBlock?.value ?? '',
                              components: {code: MarkdownCodeRenderer},
                              paragraphTag: 'div',
                              streaming: {hasNextChunk: group.answerBlock ? isBlockRunning(group.answerBlock) : false},
                              openLinksInNewTab: true,
                            })}
                          />
                        ),
                      }}
                    />
                  )
                  : null}
                {group.toolBlocks.length > 0
                  ? (
                    <Card
                      size="small"
                      class={`${prefixCls.value}-tool`}
                      v-slots={{
                        title: () => {
                          const pending = hasToolConfirmed(group.toolBlocks)
                          return (
                            <Flex gap="small" justify={pending ? 'space-between' : undefined} align="center">
                              <span
                                class={pending ? undefined : `${prefixCls.value}-tool-toggle`}
                                onClick={() => {
                                  if (!pending) {
                                    toggleToolCallExpanded(group.groupId)
                                  }
                                }}
                              >
                              <Space>
                                <CodeOutlined />
                                <span>{locale.value.toolCall}</span>
                                {pending
                                  ? null
                                  : (
                                    <RightOutlined
                                      class={classNames(
                                        `${prefixCls.value}-tool-arrow`,
                                        toolCallExpandedState.value[group.groupId] && `${prefixCls.value}-tool-arrow-open`,
                                      )}
                                    />
                                  )}
                              </Space>
                              </span>
                              {findToolConfirmedItem(group.toolBlocks).length > 1
                                ? (
                                  <Space>
                                    <Button
                                      size="small"
                                      type="primary"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        void clickAllToolConfirmed(group.toolBlocks, true)
                                      }}
                                      v-slots={{icon: () => <CheckOutlined />}}
                                    >
                                      {locale.value.allowAll}
                                    </Button>
                                    <Button
                                      size="small"
                                      danger
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        void clickAllToolConfirmed(group.toolBlocks, false)
                                      }}
                                      v-slots={{icon: () => <CloseOutlined />}}
                                    >
                                      {locale.value.rejectAll}
                                    </Button>
                                  </Space>
                                )
                                : null}
                            </Flex>
                          )
                        },
                      }}
                    >
                      {toolCallExpandedState.value[group.groupId]
                        ? (
                          <div class={`${prefixCls.value}-tool-body`}>
                            <ThoughtChain
                              items={group.toolBlocks.map(toThoughtChainItem)}
                              v-slots={{
                                title: (slot: {item: ThoughtChainItemDataType}) => (
                                  <Typography.Text
                                    delete={slot.item.status === 'abort'}
                                    type={slot.item.status === 'abort' ? 'secondary' : undefined}
                                  >
                                    {slot.item.title}
                                  </Typography.Text>
                                ),
                                content: (slot: {item: ThoughtChainItemDataType}) => {
                                  const row = chainItem(slot)
                                  const output = row.data?.outputText
                                  const succeeded = row.data?.resultState === 'success'
                                  if (row.title === 'tavily_search' && output && succeeded) {
                                    const source = getTavilySearchSourceConfig(output)
                                    return source
                                      ? (
                                        <div class={`${prefixCls.value}-scroll-tall`}>
                                          <Sources
                                            {...source}
                                            expandIconPosition="end"
                                            v-slots={{
                                              iconRender: ({item}: {item: {favicon?: string}}) => (
                                                <Avatar size="small" src={item.favicon} />
                                              ),
                                            }}
                                          />
                                        </div>
                                      )
                                      : null
                                  }
                                  if (row.title === 'tavily_extract' && output && succeeded) {
                                    const results = getTavilyExtractResult(output) as Array<{
                                      url: string
                                      title: string
                                      raw_content?: string
                                    }>
                                    return (
                                      <Space orientation="vertical">
                                        {results.map((result) => (
                                          <Popover
                                            key={result.url}
                                            title={result.title}
                                            v-slots={{
                                              content: () => result.raw_content
                                                ? (
                                                  <div class={`${prefixCls.value}-scroll`}>
                                                    <Markdown
                                                      {...markdownAttrs({
                                                        content: result.raw_content,
                                                        components: {code: MarkdownCodeRenderer},
                                                        paragraphTag: 'div',
                                                        openLinksInNewTab: true,
                                                      })}
                                                    />
                                                  </div>
                                                )
                                                : null,
                                            }}
                                          >
                                            <Typography.Link href={result.url} target="_blank">
                                              {result.title}
                                            </Typography.Link>
                                          </Popover>
                                        ))}
                                      </Space>
                                    )
                                  }
                                  if (output) {
                                    return (
                                      <div class={`${prefixCls.value}-scroll-tall`}>
                                        <Markdown
                                          {...markdownAttrs({
                                            content: output,
                                            components: {code: MarkdownCodeRenderer},
                                            paragraphTag: 'div',
                                            openLinksInNewTab: true,
                                          })}
                                        />
                                      </div>
                                    )
                                  }
                                  return null
                                },
                                footer: (slot: {item: ThoughtChainItemDataType}) => {
                                  const data = chainItem(slot).data
                                  if (data?.hitlStatus !== AI_SERVER_AGENT_TOOL_BLOCK_STATUS.PENDING || data.userConfirmed !== undefined) {
                                    return null
                                  }
                                  return (
                                    <Space>
                                      <Button
                                        size="small"
                                        type="primary"
                                        onClick={() => void clickToolConfirmed(data, true)}
                                        v-slots={{icon: () => <CheckOutlined />}}
                                      >
                                        {locale.value.allow}
                                      </Button>
                                      <Button
                                        size="small"
                                        danger
                                        onClick={() => void clickToolConfirmed(data, false)}
                                        v-slots={{icon: () => <CloseOutlined />}}
                                      >
                                        {locale.value.reject}
                                      </Button>
                                    </Space>
                                  )
                                },
                              }}
                            />
                          </div>
                        )
                        : null}
                    </Card>
                  )
                  : null}
                {group.errorBlock
                  ? <Alert type="error" showIcon message={group.errorBlock.value} />
                  : null}
              </div>
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

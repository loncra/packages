import {computed, defineComponent, type PropType} from 'vue'
import {Avatar, Button, Card, Flex, Popover, Space, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {Sources, ThoughtChain} from '@antdv-next/x'
import {CheckOutlined, CloseOutlined, CodeOutlined, RightOutlined} from '@antdv-next/icons'
import {Markdown, MarkdownCodeRenderer} from '@loncra/antdv-chat'
import type {AgentToolCallBlock} from '@loncra/chat-core'
import {AI_SERVER_AGENT_TOOL_BLOCK_STATUS} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import {AGENT_BUBBLE_PREFIX} from './style/index'
import {
  findToolConfirmedItem,
  getTavilyExtractResult,
  getTavilySearchSourceConfig,
  markdownAttrs,
  toThoughtChainItem,
} from './useAgentAssistantContent'
import type {BlockGroup, ThoughtChainItemDataType} from './types'

function chainItem(slot: {item: {data?: AgentToolCallBlock; title?: unknown; status?: string}}): ThoughtChainItemDataType {
  return slot.item as ThoughtChainItemDataType
}

function renderSearchContent(prefixCls: string, row: ThoughtChainItemDataType) {
  const output = row.data?.outputText
  if (row.title !== 'tavily_search' || !output || row.data?.resultState !== 'success') {
    return null
  }
  const source = getTavilySearchSourceConfig(output)
  if (!source) {
    return null
  }
  return (
    <div class={`${prefixCls}-scroll-tall`}>
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
}

function renderExtractContent(prefixCls: string, row: ThoughtChainItemDataType) {
  const output = row.data?.outputText
  if (row.title !== 'tavily_extract' || !output || row.data?.resultState !== 'success') {
    return null
  }
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
                <div>
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

function renderToolContent(prefixCls: string, row: ThoughtChainItemDataType) {
  const output = row.data?.outputText
  if (!output) {
    return null
  }
  return renderSearchContent(prefixCls, row)
    ?? renderExtractContent(prefixCls, row)
    ?? (
      <div class={`${prefixCls}-scroll-tall`}>
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

const AgentToolCallCard = defineComponent({
  name: 'LAgentToolCallCard',
  props: {
    group: {type: Object as PropType<BlockGroup>, required: true},
    expanded: {type: Boolean, required: true},
  },
  emits: {
    toggle: () => true,
    decide: (_tool: AgentToolCallBlock, _confirmed: boolean) => true,
    decideAll: (_tools: AgentToolCallBlock[], _confirmed: boolean) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))

    const pendingTools = computed(() => findToolConfirmedItem(props.group.toolBlocks))
    const items = computed(() => props.group.toolBlocks.map(toThoughtChainItem))

    return () => (
      <Card
        size="small"
        class={`${prefixCls.value}-tool`}
        v-slots={{
          title: () => {
            const pending = pendingTools.value.length > 0
            return (
              <Flex gap="small" justify={pending ? 'space-between' : undefined} align="center">
                <span
                  class={pending ? undefined : `${prefixCls.value}-tool-toggle`}
                  onClick={() => {
                    if (!pending) {
                      emit('toggle')
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
                            props.expanded && `${prefixCls.value}-tool-arrow-open`,
                          )}
                        />
                      )}
                  </Space>
                </span>
                {pendingTools.value.length > 1
                  ? (
                    <Space>
                      <Button
                        size="small"
                        type="primary"
                        onClick={(event) => {
                          event.stopPropagation()
                          emit('decideAll', props.group.toolBlocks, true)
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
                          emit('decideAll', props.group.toolBlocks, false)
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
        {props.expanded
          ? (
            <div class={`${prefixCls.value}-tool-body`}>
              <ThoughtChain
                items={items.value}
                v-slots={{
                  title: (slot: {item: ThoughtChainItemDataType}) => (
                    <Typography.Text
                      delete={slot.item.status === 'abort'}
                      type={slot.item.status === 'abort' ? 'secondary' : undefined}
                    >
                      {slot.item.title}
                    </Typography.Text>
                  ),
                  content: (slot: {item: ThoughtChainItemDataType}) => renderToolContent(prefixCls.value, chainItem(slot)),
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
                          onClick={() => emit('decide', data, true)}
                          v-slots={{icon: () => <CheckOutlined />}}
                        >
                          {locale.value.allow}
                        </Button>
                        <Button
                          size="small"
                          danger
                          onClick={() => emit('decide', data, false)}
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
  },
})

export default AgentToolCallCard

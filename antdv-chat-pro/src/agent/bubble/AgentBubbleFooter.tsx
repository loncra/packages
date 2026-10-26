import {computed, defineComponent, ref, type PropType} from 'vue'
import {Badge, Button, Divider, Flex, Popover, Progress, Space, Tag} from 'antdv-next'
import {
  CopyOutlined,
  DatabaseOutlined,
  FileExclamationOutlined,
  ProfileOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import {
  AI_SERVER_AGENT_CONTENT_TYPE,
  BLOCK_RUNNING_STATUS_VALUE,
  CHAT_BUBBLE_TYPE,
} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import useStyle, {AGENT_BUBBLE_PREFIX} from './style/index'
import {cacheHitRate, countTokenUsage, eachTokenUsage} from './tokenUsage'
import type {AgentBubbleFooterItem} from './types'

const TYPE_STYLE: Record<number, {color: string; icon: typeof QuestionCircleOutlined}> = {
  10: {color: 'cyan', icon: QuestionCircleOutlined},
  20: {color: 'pink', icon: ProfileOutlined},
  30: {color: 'purple', icon: RobotOutlined},
}

const AgentBubbleFooter = defineComponent({
  name: 'LAgentBubbleFooter',
  props: {
    item: {type: Object as PropType<AgentBubbleFooterItem>, required: true},
  },
  setup(props) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const copied = ref(false)

    const answer = computed(() => {
      const blocks = (props.item.content ?? []).filter((block) =>
        getEnumValue(block.type as string) === AI_SERVER_AGENT_CONTENT_TYPE.ANSWER,
      )
      return blocks.at(-1)
    })
    const answerReady = computed(() => {
      const status = answer.value?.status
      if (answer.value == null || status == null) {
        return false
      }
      return !BLOCK_RUNNING_STATUS_VALUE.includes(getEnumValue(status as string))
    })

    async function copyAnswer() {
      const text = typeof answer.value?.value === 'string' ? answer.value.value : ''
      try {
        await navigator.clipboard.writeText(text)
        copied.value = true
      } catch {
        return
      }
    }

    function tokenRows(field: 'inputTokens' | 'outputTokens' | 'cachedTokens', color: string, label: string) {
      const rows = eachTokenUsage(props.item, field)
      return (
        <>
          <Flex justify="space-between" align="center">
            <Badge color={color} text={label} />
            <span>{countTokenUsage(props.item, field)}</span>
          </Flex>
          {rows.length > 1
            ? rows.map((row) => (
              <Flex key={row.id} justify="space-between" align="center">
                <span>{row.id}</span>
                <span>{row.value}</span>
              </Flex>
            ))
            : null}
        </>
      )
    }

    function renderAiFooter(item: AgentBubbleFooterItem) {
      const showToken = Boolean(item.metadata?.tokenUsage)
      if (!answerReady.value && !showToken) {
        return null
      }
      return (
        <div class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}>
          <Space class={`${prefixCls.value}-footer`}>
            {answerReady.value
              ? (
                <Button
                  size="small"
                  variant="outlined"
                  color={copied.value ? 'cyan' : 'default'}
                  onClick={() => void copyAnswer()}
                  v-slots={{icon: () => <CopyOutlined />}}
                />
              )
              : null}
            {showToken
              ? (
                <Popover
                    trigger={"click"}
                    v-slots={{
                    title: () => (
                      <Flex justify="space-between" align="center">
                        <span>{locale.value.tokenTotal}</span>
                        <span>{countTokenUsage(item)}</span>
                      </Flex>
                    ),
                    content: () => (
                      <Flex vertical gap="small" class={`${prefixCls.value}-token-list`}>
                        {tokenRows('inputTokens', 'blue', locale.value.tokenInput)}
                        <Divider class={`${prefixCls.value}-divider-flush`} />
                        {tokenRows('outputTokens', 'magenta', locale.value.tokenOutput)}
                        <Divider class={`${prefixCls.value}-divider-flush`} />
                        {tokenRows('cachedTokens', 'yellow', locale.value.tokenCache)}
                        <Divider class={`${prefixCls.value}-divider-flush`} />
                        <Badge color="green" text={locale.value.tokenCacheHitRate} />
                        <Progress size="small" status="active" percent={cacheHitRate(item)} />
                      </Flex>
                    ),
                  }}
                >
                  <Button size="small" variant="dashed" v-slots={{icon: () => <DatabaseOutlined />}}>
                    {locale.value.token}:{countTokenUsage(item)}
                  </Button>
                </Popover>
              )
              : null}
          </Space>
        </div>
      )
    }

    function renderUserFooter(item: AgentBubbleFooterItem) {
      if (item.role !== CHAT_BUBBLE_TYPE.USER || item.data == null) {
        return null
      }
      const typeValue = Number(getEnumValue(item.type as number))
      const style = TYPE_STYLE[typeValue]
      const Icon = style?.icon ?? FileExclamationOutlined
      return (
        <Space>
          <Tag
            variant="outlined"
            color={style?.color ?? 'default'}
            v-slots={{
              icon: () => <Icon />,
              default: () => getEnumName(item.type),
            }}
          />
          <Tag variant="outlined" color="blue">
            {item.model?.manufacturer?.name}:{item.model?.name}
          </Tag>
        </Space>
      )
    }

    return () => {
      const item = props.item
      if (item.role === CHAT_BUBBLE_TYPE.AI) {
        return renderAiFooter(item)
      }
      return renderUserFooter(item)
    }
  },
})

export default AgentBubbleFooter

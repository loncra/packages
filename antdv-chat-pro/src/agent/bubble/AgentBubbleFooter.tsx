import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Button, Divider, Flex, Popover, Progress, Space, Tag, Typography} from 'antdv-next'
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
} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale.ts'
import useStyle, {AGENT_BUBBLE_PREFIX} from './style/index.ts'
import {cacheHitRate, countTokenUsage, eachTokenUsage} from './tokenUsage.ts'
import type {AgentTokenUsage} from './types.ts'

interface FooterItem {
  role: string
  key?: string | number
  content?: ReadonlyArray<{type?: unknown; status?: unknown; value?: unknown}>
  metadata?: {tokenUsage?: AgentTokenUsage[]}
  copy?: boolean
  data?: unknown
  type?: unknown
  model?: {name?: string; manufacturer?: {name?: string}}
}

const TYPE_STYLE: Record<number, {color: string; icon: typeof QuestionCircleOutlined}> = {
  10: {color: 'cyan', icon: QuestionCircleOutlined},
  20: {color: 'pink', icon: ProfileOutlined},
  30: {color: 'purple', icon: RobotOutlined},
}

const AgentBubbleFooter = defineComponent({
  name: 'LAgentBubbleFooter',
  props: {
    item: {type: Object as PropType<FooterItem>, required: true},
  },
  setup(props) {
    const locale = useLocale('AgentBubble')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-bubble', AGENT_BUBBLE_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

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
        props.item.copy = true
      } catch {
        // 剪贴板失败时保持原状态，不提示。
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

    return () => {
      const item = props.item
      if (item.role === 'ai') {
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
                    color={item.copy ? 'cyan' : 'default'}
                    onClick={() => void copyAnswer()}
                    v-slots={{icon: () => <CopyOutlined />}}
                  />
                )
                : null}
              {showToken
                ? (
                  <Popover
                    v-slots={{
                      title: () => (
                        <Flex justify="space-between" align="center">
                          <span>{locale.value.tokenTotal}</span>
                          <span>{countTokenUsage(item)}</span>
                        </Flex>
                      ),
                      content: () => (
                        <Flex vertical gap="small">
                          {tokenRows('inputTokens', 'blue', locale.value.tokenInput)}
                          <Divider />
                          {tokenRows('outputTokens', 'magenta', locale.value.tokenOutput)}
                          <Divider />
                          {tokenRows('cachedTokens', 'yellow', locale.value.tokenCache)}
                          <Divider />
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
      if (item.role !== 'user' || item.data == null) {
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
  },
})

export default AgentBubbleFooter

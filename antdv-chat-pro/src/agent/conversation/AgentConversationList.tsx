import {computed, defineComponent, nextTick, type PropType, type VNode} from 'vue'
import {
  Button,
  Divider,
  Flex,
  Input,
  Menu,
  SpaceCompact,
  type MenuItemType,
} from 'antdv-next'
import {
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CommentOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  LoadingOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ShopOutlined,
  StopOutlined,
} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale.ts'
import {getEnumValue, isEnumValue} from '@loncra/client/commons'
import {AI_SERVER_AGENT_CHAT_STATUS, AI_SERVER_AGENT_CONVERSATION_TYPE} from '@loncra/client/ai'
import ConversationList from '../../conversation/ConversationList.tsx'
import type {ConversationNode} from '../../conversation/types.ts'
import {
  agentMenuKeys,
  type AgentConversationHost,
  type AgentConversationMenuKey,
  type AgentConversationRecord,
} from './useAgentConversations.ts'
import useStyle, {AGENT_CONVERSATION_PREFIX} from './style/index.ts'

export interface AgentConversationActions {
  startCreate: () => void
  startRename: (item: AgentConversationRecord) => void
  cancelEdit: (item: AgentConversationRecord) => void
  confirmEdit: (item: AgentConversationRecord) => void
  remove: (item: AgentConversationRecord) => void
}

const STATUS_ICON = {
  [AI_SERVER_AGENT_CHAT_STATUS.READY]: {icon: CommentOutlined, className: 'secondary'},
  [AI_SERVER_AGENT_CHAT_STATUS.RUNNING]: {icon: LoadingOutlined, className: 'running'},
  [AI_SERVER_AGENT_CHAT_STATUS.REQUEST_STOP]: {icon: QuestionCircleOutlined, className: 'warning'},
  [AI_SERVER_AGENT_CHAT_STATUS.STOPPED]: {icon: StopOutlined, className: 'warning'},
  [AI_SERVER_AGENT_CHAT_STATUS.COMPLETED]: {icon: CheckCircleOutlined, className: 'success'},
  [AI_SERVER_AGENT_CHAT_STATUS.FAILED]: {icon: CloseCircleOutlined, className: 'error'},
} as const

const AgentConversationList = defineComponent({
  name: 'LAgentConversationList',
  props: {
    items: {type: Array as PropType<AgentConversationRecord[]>, required: true},
    loading: {type: Boolean, default: false},
    selectedKeys: {type: Array as PropType<string[]>, required: true},
    openKeys: {type: Array as PropType<string[]>, required: true},
    host: {type: Object as PropType<AgentConversationHost>, required: true},
    actions: {type: Object as PropType<AgentConversationActions>, required: true},
  },
  emits: ['update:selectedKeys', 'update:openKeys'],
  setup(props, {emit}) {
    const locale = useLocale('AgentConversation')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-conversation', AGENT_CONVERSATION_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function tone(name: string) {
      return `${prefixCls.value}-${name}`
    }

    function renderIcon(item: AgentConversationRecord) {
      const type = getEnumValue(item.type)
      if (isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)
        || isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE)) {
        const Icon = props.openKeys.includes(String(item.key ?? item.id)) ? FolderOpenOutlined : FolderOutlined
        const color = isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)
          ? 'primary'
          : 'success'
        return <Icon class={tone(color)} />
      }
      const status = getEnumValue(item.status as number)
      const spec = STATUS_ICON[status as keyof typeof STATUS_ICON]
        ?? STATUS_ICON[AI_SERVER_AGENT_CHAT_STATUS.READY]
      const Icon = spec.icon
      return <Icon class={tone(spec.className)} />
    }

    function menuOf(item: AgentConversationRecord): MenuItemType[] {
      const copy = locale.value
      const labels: Record<AgentConversationMenuKey, MenuItemType> = {
        create: {
          key: 'create',
          label: copy.createAgent,
          icon: () => <PlusOutlined />,
        },
        rename: {
          key: 'rename',
          label: copy.rename,
          icon: () => <EditOutlined />,
        },
        delete: {
          key: 'delete',
          danger: true,
          label: copy.delete,
          icon: () => <DeleteOutlined />,
        },
      }
      const keys = agentMenuKeys(item.type)
      const items: MenuItemType[] = []
      for (const key of keys) {
        if (key === 'delete' && keys.length > 1) {
          items.push({type: 'divider'})
        }
        items.push(labels[key])
      }
      return items
    }

    function onMenu(key: string, item: AgentConversationRecord) {
      if (key === 'create') {
        props.host.onOpen(item)
        return
      }
      if (key === 'rename') {
        props.actions.startRename(item)
        return
      }
      if (key === 'delete') {
        void props.actions.remove(item)
      }
    }

    function renderEditor(item: AgentConversationRecord) {
      return (
        <SpaceCompact size="small" block>
          <Input
            value={item.name}
            placeholder={locale.value.workspacePlaceholder}
            disabled={props.loading}
            autoFocus
            onVnodeMounted={(vnode: VNode) => {
              const exposed = vnode.component?.exposed as {focus?: () => void} | null
              void nextTick(() => exposed?.focus?.())
            }}
            onUpdate:value={(value: string) => {
              item.name = value
            }}
            onPressEnter={() => props.actions.confirmEdit(item)}
          />
          <Button
            type="primary"
            loading={props.loading}
            onClick={() => props.actions.confirmEdit(item)}
            v-slots={{icon: () => <CheckOutlined />}}
          />
          <Button
            type="primary"
            danger
            disabled={props.loading}
            onClick={() => props.actions.cancelEdit(item)}
            v-slots={{icon: () => <CloseOutlined />}}
          />
        </SpaceCompact>
      )
    }

    function toNode(item: AgentConversationRecord, lookup: Map<string, AgentConversationRecord>): ConversationNode {
      const key = String(item.key ?? item.id)
      lookup.set(key, item)
      const isConversation = isEnumValue(item.type, AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION)
      const children = (item.children || []) as AgentConversationRecord[]
      return {
        key,
        name: item.name ?? '',
        editing: item.editing,
        timeText: isConversation && item.creationTime != null
          ? props.host.timeText(item.creationTime)
          : undefined,
        children: children.length > 0 ? children.map((child) => toNode(child, lookup)) : undefined,
      }
    }

    return () => {
      const lookup = new Map<string, AgentConversationRecord>()
      const nodes = props.items.map((item) => toNode(item, lookup))
      return (
        <ConversationList
          class={classNames(prefixCls.value, hashId.value, cssVarCls.value)}
          items={nodes}
          loading={props.loading}
          selectedKeys={props.selectedKeys}
          openKeys={props.openKeys}
          onUpdate:selectedKeys={(keys: string[]) => emit('update:selectedKeys', keys)}
          onUpdate:openKeys={(keys: string[]) => emit('update:openKeys', keys)}
          onActive={(key: string) => {
            const item = lookup.get(key)
            if (item) {
              props.host.onOpen(item)
            }
          }}
          v-slots={{
            header: () => (
              <>
                <div class={`${prefixCls.value}-header`}>
                  <Button
                    block
                    type="primary"
                    onClick={() => props.host.onOpenPluginMarket()}
                    v-slots={{icon: () => <ShopOutlined />}}
                  >
                    {locale.value.pluginMarket}
                  </Button>
                </div>
                <Divider plain titlePlacement="start" class="loncra-common-margin-none">
                  <Flex align="center" gap="small">
                    <FolderOutlined />
                    <span>{locale.value.workspaceTitle}</span>
                    <Button
                      type="text"
                      size="small"
                      onClick={() => props.actions.startCreate()}
                      v-slots={{icon: () => <PlusOutlined />}}
                    />
                  </Flex>
                </Divider>
              </>
            ),
            icon: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              return item && !item.editing ? renderIcon(item) : null
            },
            editor: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              return item ? renderEditor(item) : null
            },
            actions: (node: ConversationNode) => {
              const item = lookup.get(node.key)
              if (!item) {
                return null
              }
              return (
                <Menu
                  items={menuOf(item)}
                  onClick={(info: {key: string | number}) => onMenu(String(info.key), item)}
                />
              )
            },
          }}
        />
      )
    }
  },
})

export default AgentConversationList

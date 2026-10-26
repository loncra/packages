import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onMounted,
  type PropType,
  reactive,
  ref,
  watch,
} from 'vue'
import {Avatar, Flex, type MenuItemType, Space, Splitter, SplitterPanel, Tag} from 'antdv-next'
import {
  ApiOutlined,
  createFromIconfontCN,
  ProfileOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
} from '@antdv-next/icons'
import {Welcome, XProvider} from '@antdv-next/x'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import useApp from 'antdv-next/dist/app/useApp'
import {classNames} from '@loncra/antdv'
import type {InstructionItem, InstructionMeasure, InstructionSenderHandle} from '@loncra/antdv-chat'
import {appendMessages, type ChatRole, type InstructionBlock} from '@loncra/chat-core'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  filterTreeDeep,
  findFirstTreeNode,
  getEnumValue,
  isEnumValue,
  type IdValueMetadata,
  ResourceServerService,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  unmergeTree,
} from '@loncra/client/commons'
import {AuthServerService, type PlatformUser, type UserMetadata} from '@loncra/client/auth'
import {
  AGENT_WORKSPACE_TYPE_VALUE,
  AI_SERVER_AGENT_CHAT_STATUS,
  AI_SERVER_AGENT_CHAT_TYPE,
  AI_SERVER_AGENT_CONVERSATION_TYPE,
  AI_SERVER_MODEL_TYPE,
  AI_SERVER_PLUGIN_INSTALL_STATUS,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  AI_SERVER_PLUGIN_TARGET_TYPE,
  type AgentChatResponseBody,
  type AgentConversationEntity,
  type AgentMessageEntity,
  CHAT_BUBBLE_TYPE,
  type ModelSettingEntity,
  ModelSettingService,
  STREAM_RUNNING_STATUS_VALUE,
  type UserPluginInstallResult,
} from '@loncra/client/ai'
import type {BubbleListExpose} from '../bubble-list/types'
import {useLocale} from '../_util/useLocale'
import {createAgentDraftBinding} from './draft/createAgentDraftBinding'
import {useAgentHistory} from './history/useAgentHistory'
import {useAgentConversations} from './conversation'
import type {AgentConversationHost, AgentConversationRecord} from './conversation'
import AgentConversationList from './conversation/AgentConversationList'
import AgentBubbleList from './bubble/AgentBubbleList'
import AgentSender, {type AgentSenderChoice, type AgentSenderExpose, type AgentSenderWorkspace} from './sender/AgentSender'
import {sendAgentChat} from './send/sendAgentChat'
import AgentHub from './hub/AgentHub'
import type {AgentSession} from './types'
import useStyle, {AGENT_CHAT_PREFIX} from './style'

dayjs.extend(relativeTime)

const IconFont = createFromIconfontCN()

const TRIGGER = '/'
const MCP_PREFIX = '/mcp'
const SKILL_PREFIX = '/skill'

type Self = PlatformUser | (UserMetadata & {systemName: string})

function emptyPage(): AgentSession['dataSource'] {
  return {
    elements: [],
    first: true,
    last: true,
    number: 1,
    size: 10,
    metadata: {},
  }
}

function nodeKey(item: {key?: string; id?: number}): string {
  return String(item.key ?? item.id ?? '')
}

function ensureSession(item: AgentConversationRecord): AgentSession {
  const session = item as AgentSession
  if (!session.dataSource) {
    session.dataSource = emptyPage()
  }
  if (session.loading == null) {
    session.loading = false
  }
  return session
}

function isConversation(item: {type?: unknown}): boolean {
  return isEnumValue(item.type, AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION)
}

function typeIcon(type: number) {
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.ASK)) {
    return QuestionCircleOutlined
  }
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.PLAN)) {
    return ProfileOutlined
  }
  return RobotOutlined
}

function typeColor(type: number): string {
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.ASK)) {
    return 'cyan'
  }
  if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.PLAN)) {
    return 'pink'
  }
  return 'purple'
}

function iconNode(type: string | undefined) {
  if (!type) {
    return null
  }
  return h(IconFont, {type})
}

function running(session: AgentSession | undefined): boolean {
  if (!session) {
    return false
  }
  return session.dataSource.elements.some((item) => {
    if (item.role !== CHAT_BUBBLE_TYPE.AI) {
      return false
    }
    const status = (item as {status?: unknown}).status
    if (status == null) {
      return false
    }
    return STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(status as number))
  })
}

const AgentChat = defineComponent({
  name: 'LAgent',
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    self: {type: Object as PropType<Self>, required: true},
  },
  emits: ['active', 'resume', 'cancel', 'installed', 'uninstalled'],
  setup(props, {emit, slots}) {
    const chatLocale = useLocale('AgentChat')
    const hubLocale = useLocale('AgentHub')
    const {message} = useApp()
    const instance = getCurrentInstance()
    const antdConfig = useConfig()
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-chat', AGENT_CHAT_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const conversations = ref<AgentConversationRecord[]>([])
    const selectedKeys = ref<string[]>([])
    const openKeys = ref<string[]>([])
    const pane = ref<'chat' | 'hub'>('chat')
    const current = ref<AgentSession>()
    const senderRef = ref<AgentSenderExpose>()
    const bubbleListRef = ref<BubbleListExpose>()
    const models = ref<ModelSettingEntity[]>([])
    const types = ref<IdValueMetadata<number, string>[]>([])
    const modelOptions = ref<MenuItemType[]>([])
    const typeOptions = ref<MenuItemType[]>([])
    const form = reactive({
      type: AI_SERVER_AGENT_CHAT_TYPE.AGENT as number,
      modelId: undefined as number | undefined,
    })
    const selfName = computed(
      () => AuthServerService.getPrincipalNameByUserDetails(props.self) || '-',
    )

    const history = useAgentHistory(current, {
      noMoreText: () => chatLocale.value.noMore,
      nowUnix: () => dayjs().unix(),
      resolveRole: (row: AgentMessageEntity): ChatRole => {
        const role = getEnumValue(row.role)
        if (role === CHAT_BUBBLE_TYPE.AI) {
          return CHAT_BUBBLE_TYPE.AI
        }
        if (role === CHAT_BUBBLE_TYPE.SYSTEM) {
          return CHAT_BUBBLE_TYPE.SYSTEM
        }
        return CHAT_BUBBLE_TYPE.USER
      },
      isWorkspace: isConversation,
      scrollToBottom: () => {
        bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
      },
      jumpToMessage: (key) => {
        bubbleListRef.value?.jumpToMessage(key)
      },
    })

    function updateMenu(item: AgentConversationRecord): void {
      const treeNode = filterTreeDeep((entry) => entry.id === item.parentId, conversations.value)
      const opened = unmergeTree(treeNode)
        .filter((entry) => entry.id !== item.id)
        .map((entry) => nodeKey(entry))
      openKeys.value = [...openKeys.value, ...opened]
      const children = item.children
      if (children && children.length > 0) {
        openKeys.value = [...openKeys.value, nodeKey(item)]
        selectedKeys.value = []
        return
      }
      selectedKeys.value = [nodeKey(item)]
    }

    function sameSession(item: AgentConversationRecord): boolean {
      const session = current.value
      if (!session) {
        return false
      }
      return session === item || (session.id != null && session.id === item.id)
    }

    async function openItem(item: AgentConversationRecord): Promise<void> {
      await senderRef.value?.flush()
      pane.value = 'chat'
      if (sameSession(item)) {
        return
      }
      const session = ensureSession(item)
      updateMenu(session)
      current.value = session
      if (!isConversation(session)) {
        return
      }
      await history.switchConversation(current, undefined, true)
      emit('active', current.value)
    }

    const host: AgentConversationHost = {
      timeText: (unix) => (unix == null ? '' : dayjs(unix).fromNow()),
      onOpen: (item) => {
        void openItem(item)
      },
      onOpenPluginMarket: () => {
        pane.value = 'hub'
      },
      afterLoad: () => {},
    }
    const conversationApi = useAgentConversations(conversations, host)

    const workspaces = computed(() =>
      conversations.value.filter(
        (item) => item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type)),
      ),
    )

    function instructionIcon(prefix: string): string | undefined {
      if (prefix === MCP_PREFIX) {
        return 'loncra-plug-zap'
      }
      if (prefix === SKILL_PREFIX) {
        return 'loncra-sparkles'
      }
      return undefined
    }

    function instructionSlot(block: InstructionBlock): SlotConfigType {
      return {
        type: 'custom',
        key: block.id,
        props: {slotKind: 'instruction', defaultValue: block.value, prefix: block.prefix},
        customRender: (value: IdValueMetadata<string, string>, _onChange, _slotProps, item) => {
          const slotKey = 'key' in item && item.key ? item.key : ''
          const prefix = item.type === 'custom'
            ? String((item.props as {prefix?: string} | undefined)?.prefix ?? '')
            : ''
          const icon = instructionIcon(prefix)
          const node = h(
            XProvider,
            {locale: antdConfig.value.locale, theme: antdConfig.value.theme},
            {
              default: () =>
                h(Tag, {key: slotKey, variant: 'outlined'}, {
                  icon: icon ? () => iconNode(icon) : undefined,
                  default: () => value.value,
                }),
            },
          )
          if (instance) {
            node.appContext = instance.appContext
          }
          return node
        },
      }
    }

    const binding = createAgentDraftBinding({
      principal: () => props.self.systemName || undefined,
      targetId: () => (current.value?.id == null ? undefined : String(current.value.id)),
      factories: {restoreInstructionSlot: instructionSlot},
    })

    function readLive(): SlotConfigType[] {
      return senderRef.value?.getSlotConfigValue() ?? []
    }

    function currentWorkspaceId(): number | undefined {
      const session = current.value
      if (!session) {
        return undefined
      }
      if (isConversation(session)) {
        return session.parentId
      }
      return session.id
    }

    const catalogItems = computed<InstructionItem[]>(() => {
      const workspaceId = currentWorkspaceId()
      const items: InstructionItem[] = []
      for (const item of props.installs) {
        if (getEnumValue(item.status) !== AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED) {
          continue
        }
        if (!item.pluginPackage || item.packageId == null) {
          continue
        }
        const scope = getEnumValue(item.workspaceScope)
        if (scope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG) {
          if (workspaceId == null) {
            continue
          }
          if (!item.workspaces?.some((workspace) => String(workspace.id) === String(workspaceId))) {
            continue
          }
        }
        const targetType = getEnumValue(item.targetType)
        const isMcp = targetType === AI_SERVER_PLUGIN_TARGET_TYPE.MCP
        const isSkill = targetType === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL
        if (!isMcp && !isSkill) {
          continue
        }
        items.push({
          id: String(item.packageId),
          value: item.pluginPackage.name,
          metadata: {
            trigger: TRIGGER,
            group: isMcp ? 'mcp' : 'skill',
            groupLabel: isMcp ? hubLocale.value.mcp : hubLocale.value.skill,
            slotPrefix: isMcp ? MCP_PREFIX : SKILL_PREFIX,
            icon: item.pluginPackage.icon,
          },
        })
      }
      return items
    })

    const instructionMap = computed(() => ({
      [TRIGGER]: catalogItems.value.filter((item) => item.metadata?.trigger === TRIGGER),
    }))

    function toCatalogMenuItems(items: InstructionItem[]): MenuItemType[] {
      const groups = new Map<string, {label: string; icon: string; children: MenuItemType[]}>()
      for (const item of items) {
        const group = String(item.metadata?.group ?? '')
        if (!group) {
          continue
        }
        let bucket = groups.get(group)
        if (!bucket) {
          bucket = {
            label: String(item.metadata?.groupLabel ?? group),
            icon: group === 'mcp' ? 'loncra-plug-zap' : 'loncra-sparkles',
            children: [],
          }
          groups.set(group, bucket)
        }
        const icon = String(item.metadata?.icon || '')
        bucket.children.push({
          key: group + ':' + item.id,
          label: item.value,
          icon: icon ? () => iconNode(icon) : undefined,
        })
      }
      return Array.from(groups.entries()).map(([key, group]) => ({
        type: 'group' as const,
        key,
        label: h(Space, {}, () => [iconNode(group.icon), h('span', {}, group.label)]),
        children: group.children,
      }))
    }

    function filterInstruction(keyword: string, dataSource: InstructionItem[]): InstructionItem[] {
      const query = keyword.trim().toLowerCase()
      if (!query) {
        return dataSource
      }
      return dataSource.filter((item) => item.value.toLowerCase().includes(query))
    }

    function findCatalogItem(key: string | number): InstructionItem | undefined {
      const raw = String(key)
      const separator = raw.indexOf(':')
      if (separator < 0) {
        return undefined
      }
      const group = raw.slice(0, separator)
      const id = raw.slice(separator + 1)
      return catalogItems.value.find((item) => item.metadata?.group === group && item.id === id)
    }

    function insertCatalogItem(option: InstructionItem, measure?: InstructionMeasure): void {
      const sender = senderRef.value?.getSender()
      if (!sender) {
        return
      }
      const slotPrefix = String(option.metadata?.slotPrefix ?? measure?.prefix ?? '')
      if (!slotPrefix) {
        return
      }
      const block = instructionSlot({
        id: crypto.randomUUID(),
        type: 'custom',
        slotKind: 'instruction',
        value: {id: String(option.id ?? ''), value: option.value},
        prefix: slotPrefix,
      })
      if (measure) {
        sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
        return
      }
      sender.insert([block, {type: 'text', value: ' '}], 'cursor')
    }

    function createInstructionSlot(option: InstructionItem, measure: InstructionMeasure): object {
      return instructionSlot({
        id: crypto.randomUUID(),
        type: 'custom',
        slotKind: 'instruction',
        value: option as unknown as IdValueMetadata<string, string>,
        prefix: String(option.metadata?.slotPrefix ?? measure.prefix),
      })
    }

    function senderInsertInstruction(
      sender: InstructionSenderHandle,
      block: object,
      measure: InstructionMeasure,
    ): void {
      sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
    }

    function toModelMenuItems(rows: ModelSettingEntity[]): MenuItemType[] {
      const groups = new Map<string, {label: string; icon?: string; children: MenuItemType[]}>()
      for (const item of rows) {
        const code = item.manufacturer?.code || 'unknown'
        const label = item.manufacturer?.name || ''
        let group = groups.get(code)
        if (!group) {
          const icon = item.manufacturer?.metadata?.icon
          group = {label, icon: typeof icon === 'string' ? icon : undefined, children: []}
          groups.set(code, group)
        }
        const icon = item.icon
        group.children.push({
          key: String(item.id),
          label: item.name,
          icon: icon ? () => iconNode(icon) : () => h(ApiOutlined),
        })
      }
      return Array.from(groups.entries()).map(([code, group]) => ({
        type: 'group' as const,
        key: code,
        label: h(Space, {}, () => [iconNode(group.icon), h('span', {}, group.label)]),
        children: group.children,
      }))
    }

    async function loadOptions(): Promise<void> {
      const modelSettingService = new ModelSettingService()
      const enumerate = await ResourceServerService.getServiceEnumerate<number, string>(
        SYSTEM_MODULE_NAME.AI_SERVER,
        SYSTEM_ENUM_TYPE.AGENT_CHAT_TYPE_ENUM,
      )
      types.value = enumerate.data || []
      typeOptions.value = types.value.map((item) => ({
        key: String(item.id),
        label: item.value,
        icon: () => h(typeIcon(Number(item.id))),
      }))
      const model = await modelSettingService.findEnabled({
        'filter_[type_eq]': AI_SERVER_MODEL_TYPE.CHAT,
      })
      models.value = model.data || []
      modelOptions.value = toModelMenuItems(models.value)
      const first = models.value[0]
      if (form.modelId == null && first?.id != null) {
        form.modelId = first.id
      }
    }

    const currentModel = computed(() => models.value.find((item) => item.id === form.modelId))

    const workspaceView = computed<AgentSenderWorkspace | undefined>(() => {
      const session = current.value
      if (!session) {
        return undefined
      }
      const workspace = isConversation(session)
        ? conversations.value.find((item) => item.id === session.parentId)
        : session
      if (!workspace?.name) {
        return undefined
      }
      const isDefault = isEnumValue(workspace.type, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)
      return {
        title: `${chatLocale.value.workspace}: ${workspace.name}`,
        color: isDefault ? 'blue' : 'green',
        variant: 'outlined',
        icon: () => iconNode(isDefault ? 'loncra-folder-cog' : 'loncra-folder-closed'),
      }
    })

    const modelView = computed<AgentSenderChoice | undefined>(() => {
      const model = currentModel.value
      if (!model) {
        return undefined
      }
      return {
        label: `${model.manufacturer.name}:${model.name}`,
        icon: model.icon,
        items: modelOptions.value,
        selectedKeys: [String(model.id)],
      }
    })

    const typeView = computed<AgentSenderChoice>(() => {
      const matched = types.value.find((item) => item.id === form.type)
      return {
        label: matched?.value,
        color: typeColor(form.type),
        items: typeOptions.value,
        selectedKeys: [String(matched?.id ?? form.type)],
      }
    })

    const isRunning = computed(() => {
      const session = current.value
      if (!session) {
        return false
      }
      return session.loading || running(session)
    })

    function applyConversationModel(session: AgentSession | undefined): void {
      if (!session) {
        form.modelId = undefined
        form.type = AI_SERVER_AGENT_CHAT_TYPE.AGENT
        return
      }
      if (session.lastModel?.id != null) {
        form.modelId = session.lastModel.id
      }
      if (session.lastChatType != null) {
        form.type = getEnumValue(session.lastChatType)
      }
    }

    watch(current, (session) => applyConversationModel(session))

    function blocksOf(slotConfig: SlotConfigType[]): unknown[] {
      const blocks: unknown[] = []
      for (const slot of slotConfig) {
        if (slot.type === 'custom' && slot.props?.slotKind === 'instruction' && slot.key) {
          const value = slot.props.defaultValue as {id?: string; value?: string} | undefined
          blocks.push({
            id: slot.key,
            value: {id: value?.id, value: value?.value},
            type: 'custom',
            prefix: slot.props.prefix,
            slotKind: 'instruction',
          })
          continue
        }
        blocks.push(slot)
      }
      return blocks
    }

    function placeConversation(body: AgentConversationEntity): AgentSession {
      const found = findFirstTreeNode(
        (item) => Number(item.id) === Number(body.id),
        conversations.value,
      )
      if (found) {
        const session = ensureSession(found)
        session.name = body.name
        session.status = body.status
        session.lastModel = body.lastModel
        session.lastChatType = body.lastChatType
        return session
      }
      const node = ensureSession(body as AgentConversationRecord)
      const parent = conversations.value.find((item) => item.id === node.parentId)
      if (parent) {
        parent.children = [node, ...((parent.children || []) as AgentConversationRecord[])]
      }
      return node
    }

    async function openReturned(body: AgentChatResponseBody): Promise<void> {
      const node = placeConversation(body.conversation)
      updateMenu(node)
      pane.value = 'chat'
      current.value = node
      if (isConversation(node)) {
        await history.switchConversation(current, undefined, true)
      }
      // 必须发 current.value（ref getter 返回的响应式代理）：新会话的 node 是 HTTP 原始对象，
      // 直接把 raw 泄漏给宿主后，SSE 经 raw 写入绕过响应式追踪，渲染层永远看不到更新。
      emit('active', current.value)
    }

    async function onSubmit(_value: string, slotConfig?: SlotConfigType[]): Promise<void> {
      const session = current.value
      if (!session || !slotConfig?.length) {
        return
      }
      session.loading = true
      try {
        const result = await sendAgentChat({
          modelId: form.modelId,
          type: form.type,
          content: blocksOf(slotConfig),
          agentConversationId: session.id,
        })
        if (!result.data?.conversation) {
          return
        }
        senderRef.value?.clear()
        await senderRef.value?.clearStored()
        if (result.data.conversation.id !== session.id) {
          await openReturned(result.data)
          return
        }
        const conversationId = Number(session.id)
        const userMessage: AgentMessageEntity = {
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          id: result.data.userMessageId,
          content: blocksOf(slotConfig),
          status: AI_SERVER_AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.USER,
          agentConversationId: conversationId,
        }
        const assistantMessage: AgentMessageEntity = {
          id: result.data.assistantMessageId,
          content: [],
          model: result.data.conversation.lastModel!,
          type: result.data.conversation.lastChatType!,
          status: AI_SERVER_AGENT_CHAT_STATUS.READY,
          role: CHAT_BUBBLE_TYPE.AI,
          agentConversationId: conversationId,
          parentId: result.data.userMessageId,
        }
        appendMessages(userMessage, CHAT_BUBBLE_TYPE.USER, session.dataSource.elements, true)
        appendMessages(assistantMessage, CHAT_BUBBLE_TYPE.AI, session.dataSource.elements, true)
        await nextTick()
        bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
        emit('active', session)
      } catch (error) {
        message.error(error instanceof Error ? error.message : String(error))
      } finally {
        session.loading = false
      }
    }

    onMounted(() => {
      void conversationApi.load()
      void loadOptions()
    })

    return () => {
      const rootClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const session = current.value
      const hasMessages = (session?.dataSource.elements.length ?? 0) > 0
      const cls = (name: string) => `${prefixCls.value}-${name}`
      return (
        <Splitter class={rootClass} aria-label={selfName.value}>
          <SplitterPanel class={cls('side')} defaultSize="20%" min="15%" max="25%">
            <AgentConversationList
              items={conversations.value}
              loading={conversationApi.loading.value}
              selectedKeys={selectedKeys.value}
              openKeys={openKeys.value}
              host={host}
              actions={conversationApi}
              onUpdate:selectedKeys={(keys: string[]) => {
                selectedKeys.value = keys
              }}
              onUpdate:openKeys={(keys: string[]) => {
                openKeys.value = keys
              }}
            />
          </SplitterPanel>
          <SplitterPanel class={cls('main')}>
            {pane.value === 'hub'
              ? (
                <AgentHub
                  installs={props.installs}
                  workspaces={workspaces.value}
                  onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                  onUninstalled={(id: number) => emit('uninstalled', id)}
                />
              )
              : (
                <div class={cls('column')}>
                  <div class={cls('stage')}>
                    {session && hasMessages
                      ? (
                        <AgentBubbleList
                          ref={bubbleListRef}
                          session={session}
                          user={props.self}
                          onResume={(id: number) => emit('resume', id)}
                          v-slots={{
                            assistantAvatar: () => <Avatar size="large">{slots.agentAvatar?.()}</Avatar>,
                          }}
                        />
                      )
                      : (
                        <Flex class={cls('welcome')} justify="center" align="center">
                          <Welcome
                            variant="borderless"
                            title={chatLocale.value.welcomeTitle}
                            description={chatLocale.value.welcomeDescription}
                            v-slots={{
                              icon: () => <div class={cls('welcome-icon')}>{slots.agentAvatar?.()}</div>,
                            }}
                          />
                        </Flex>
                      )}
                  </div>
                  <div class={cls('footer')}>
                    <AgentSender
                      ref={senderRef}
                      binding={binding}
                      readLive={readLive}
                      slotsOf={(live) => live as SlotConfigType[]}
                      onRestore={() => {}}
                      placeholder={chatLocale.value.placeholder}
                      instructionMap={instructionMap.value}
                      onFilterDataSource={filterInstruction}
                      senderInsertInstruction={senderInsertInstruction}
                      createInstructionSlot={createInstructionSlot}
                      isRunning={isRunning.value}
                      workspace={workspaceView.value}
                      catalogPrefix={TRIGGER}
                      toCatalogMenuItems={toCatalogMenuItems}
                      onCatalogClick={(key, pick) => {
                        const option = findCatalogItem(key)
                        if (option) {
                          pick(option)
                        }
                      }}
                      plusItems={toCatalogMenuItems(catalogItems.value)}
                      onPlusClick={(key) => {
                        const option = findCatalogItem(key)
                        if (option) {
                          insertCatalogItem(option)
                        }
                      }}
                      model={modelView.value}
                      typeChoice={typeView.value}
                      onModelClick={(key) => {
                        form.modelId = Number(key)
                      }}
                      onTypeClick={(key) => {
                        form.type = Number(key)
                      }}
                      onSubmit={onSubmit}
                      onCancel={() => {
                        if (current.value) {
                          emit('cancel', current.value)
                        }
                      }}
                    />
                  </div>
                </div>
              )}
          </SplitterPanel>
        </Splitter>
      )
    }
  },
})

export default AgentChat

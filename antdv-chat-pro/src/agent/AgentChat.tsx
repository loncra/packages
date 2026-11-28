import {computed, defineComponent, type PropType} from 'vue'
import {Avatar, Flex, Splitter, SplitterPanel} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {Welcome} from '@antdv-next/x'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, fillLocale} from '@loncra/antdv'
import {getEnumValue} from '@loncra/client/commons'
import {
    AgentHubService,
    type AgentStreamTransport,
    AI_SERVER_PLUGIN_INSTALL_STATUS,
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    type UserPluginInstallResult,
    type UserPluginMetadata
} from '@loncra/client/ai'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {Self} from './types'
import type {AgentConversationHost} from './conversation/types'
import type {PluginOverride} from './hub/types'
import {DataLoadingCard} from '@loncra/antdv-pro'
import {useLocale} from '../_util/useLocale'
import {toCatalogMenuItems} from './sender/agentMenus'
import {TRIGGER} from './sender/useAgentInstructionSlots'
import AgentConversationList from './conversation/AgentConversationList'
import AgentBubbleList from './bubble/AgentBubbleList'
import AgentSender from './sender/AgentSender'
import AgentHub from './hub/AgentHub'
import {useAgentChat} from './useAgentChat'
import {isWorkspaceConversation} from './conversation/useAgentConversations'
import useStyle, {AGENT_CHAT_PREFIX} from './style'

const AgentChat = defineComponent({
  name: 'LAgent',
  inheritAttrs: false,
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    self: {type: Object as PropType<Self>, required: true},
    buildHeaders: {type: Function as PropType<() => Record<string, string>>, default: undefined},
    transport: {type: Object as PropType<AgentStreamTransport>, default: undefined},
    conversationHost: {type: Object as PropType<Partial<AgentConversationHost>>, default: undefined},
    plugins: {type: Array as PropType<PluginOverride[]>, default: () => []},
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    installed: (_result: UserPluginInstallResult) => true,
    uninstalled: (_event: UserPluginMetadata) => true,
  },
  setup(props, {emit, slots, attrs}) {
    const chatLocale = useLocale('AgentChat')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-chat', props.prefixCls ?? AGENT_CHAT_PREFIX))
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const chat = useAgentChat(props)
    const {modal, message} = useApp()
    const hubLocale = useLocale('AgentHub')

    interface CatalogDisabledMeta {
        disabled?: {statusName?: string; exception?: string}
        packageId?: number
        scope?: number
    }

    function activateFromCatalog(key: string | number): void {
        const option = chat.instruction.findCatalogItem(key)
        const meta = option?.metadata as CatalogDisabledMeta | undefined
        if (!option || !meta?.disabled || meta.packageId == null) {
            return
        }
        const targetType = String(option.metadata?.group ?? '')
        modal.confirm({
            title: hubLocale.value.activateConfirmTitle,
            content: fillLocale(hubLocale.value.activateConfirmContent, {name: option.value}),
            onOk: async () => {
                const result = await AgentHubService.updateInstallStatus({
                    targetType,
                    packageId: meta.packageId!,
                    scope: meta.scope ?? AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER,
                    status: AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED,
                })
                message.success(result.message)
                const updated = result.data
                if (updated != null) {
                    emit('installed', updated)
                }
            },
        })
    }

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const session = chat.current.value
      const hasMessages = (session?.dataSource.elements.length ?? 0) > 0
      const cls = (name: string) => `${prefixCls.value}-${name}`
      const rootClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrClass as string,
      )
      return (
        <DataLoadingCard
          {...rest}
          spin={false}
          class={rootClass}
          style={attrStyle}
          v-slots={{
            extra: () => session && isWorkspaceConversation(getEnumValue(session.type)) ? session.name : '',
            default: () => (
              <Splitter class={cls('splitter')} aria-label={chat.selfName.value}>
                <SplitterPanel class={cls('side')} defaultSize="20%" min="15%" max="25%">
                  <AgentConversationList
                    items={chat.conversations.value}
                    loading={chat.conversationApi.loading.value}
                    selectedKeys={chat.selectedKeys.value}
                    openKeys={chat.openKeys.value}
                    self={props.self}
                    host={chat.host}
                    actions={chat.conversationApi}
                    onUpdate:selectedKeys={(keys: string[]) => {
                      chat.selectedKeys.value = keys
                    }}
                    onUpdate:openKeys={(keys: string[]) => {
                      chat.openKeys.value = keys
                    }}
                  />
                </SplitterPanel>
                <SplitterPanel class={cls('main')}>
                  {chat.pane.value === 'hub'
                    ? (
                      <AgentHub
                        installs={props.installs}
                        workspaces={chat.workspaces.value}
                        self={props.self}
                        plugins={props.plugins}
                        onInstalled={(result: UserPluginInstallResult) => {
                          emit('installed', result)
                        }}
                        onUninstalled={(event: UserPluginMetadata) => {
                          emit('uninstalled', event)
                        }}
                      />
                    )
                    : (
                      <div class={cls('column')}>
                        <div class={cls('stage')}>
                          {session && hasMessages
                            ? (
                              <AgentBubbleList
                                ref={chat.bubbleListRef}
                                session={session}
                                user={props.self}
                                onResume={(id: string) => chat.stream.connect(id, false)}
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
                            ref={chat.senderRef}
                            binding={chat.binding}
                            readLive={chat.readLive}
                            slotsOf={(live) => live as SlotConfigType[]}
                            onRestore={() => {}}
                            placeholder={chatLocale.value.placeholder}
                            instructionMap={chat.instruction.instructionMap.value}
                            onFilterDataSource={chat.filterInstruction}
                            senderInsertInstruction={chat.instruction.senderInsertInstruction}
                            createInstructionSlot={chat.instruction.createInstructionSlot}
                            isRunning={chat.isRunning.value}
                            workspace={chat.options.workspaceView.value}
                            catalogPrefix={TRIGGER}
                            toCatalogMenuItems={(items) => toCatalogMenuItems(items, {
                              onActivate: activateFromCatalog,
                              activateText: hubLocale.value.activate,
                            })}
                            onCatalogClick={(key, pick) => {
                              const option = chat.instruction.findCatalogItem(key)
                              if (!option) {
                                return
                              }
                              const disabled = (option.metadata as CatalogDisabledMeta | undefined)?.disabled
                              if (disabled) {
                                activateFromCatalog(key)
                                return
                              }
                              pick(option)
                            }}
                            plusItems={toCatalogMenuItems(chat.catalogItems.value, {
                              onActivate: activateFromCatalog,
                              activateText: hubLocale.value.activate,
                            })}
                            onPlusClick={(key) => {
                              const option = chat.instruction.findCatalogItem(key)
                              if (!option) {
                                return
                              }
                              const disabled = (option.metadata as CatalogDisabledMeta | undefined)?.disabled
                              if (disabled) {
                                activateFromCatalog(key)
                                return
                              }
                              chat.instruction.insertCatalogItem(option)
                            }}
                            model={chat.options.modelView.value}
                            typeChoice={chat.options.typeView.value}
                            onModelClick={(key) => {
                              chat.options.form.modelId = Number(key)
                            }}
                            onTypeClick={(key) => {
                              chat.options.form.type = Number(key)
                            }}
                            onSubmit={chat.onSubmit}
                            onCancel={() => {
                              if (chat.current.value) {
                                void chat.onCancelSession(chat.current.value)
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                </SplitterPanel>
              </Splitter>
            ),
          }}
        />
      )
    }
  },
})

export default AgentChat

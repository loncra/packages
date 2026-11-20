import {computed, defineComponent, h, type PropType, ref} from 'vue'
import {Badge, Empty, Flex, Tabs} from 'antdv-next'
import {pluginTypeIcon} from './constants'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    getEnumValue,
    type IdValueMetadata,
    type TotalPage,
} from '@loncra/client/commons'
import {
  AgentHubService,
  AI_SERVER_PLUGIN_TARGET_TYPE,
  type McpPackageEntity,
  type SkillPackageEntity,
  type UserPluginInstallResult,
  type UserPluginMetadata,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import {AGENT_HUB_PREFIX} from './style'

function toPage<T>(elements: T[]): TotalPage<T> {
  return {
    elements,
    number: 1,
    size: elements.length || 10,
    totalCount: elements.length,
    totalPages: 1,
    first: true,
    last: true,
    metadata: {},
  }
}

const InstalledPlugins = defineComponent({
  name: 'LAgentHubInstalled',
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    pluginTypes:{type: Array as PropType<IdValueMetadata<number, string>[]>, default: () => []}
  },
  emits: {
    installed: (_result: UserPluginInstallResult) => true,
    uninstalled: (_event: UserPluginMetadata) => true,
  },
  setup(props, {emit}) {
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const activeKey = ref<string>()
    const activeType = computed(() => {
      if (activeKey.value == null || activeKey.value === '') {
        return undefined
      }
      return activeKey.value
    })

    function packagesOf(targetType: string) {
      return props.installs
        .filter((item) => getEnumValue(item.targetType) === targetType)
        .map((item) => item.pluginPackage)
        .filter((item): item is NonNullable<typeof item> => item != null)
    }

    const mcpDataSource = computed(() => toPage(packagesOf(AI_SERVER_PLUGIN_TARGET_TYPE.MCP) as McpPackageEntity[]))
    const skillDataSource = computed(() => toPage(packagesOf(AI_SERVER_PLUGIN_TARGET_TYPE.SKILL) as SkillPackageEntity[]))

    return () => {
      const type = activeType.value
      return (
          <Tabs
              class={`${prefixCls.value}-tabs`}
              activeKey={activeKey.value}
              tabPlacement="start"
              classes={{
                body: `${prefixCls.value}-tabs-body`,
                content: `${prefixCls.value}-tabs-content`,
              }}
              items={props.pluginTypes.map((item) => ({label: item.value, key: String(item.id)}))}
              onUpdate:activeKey={(key: string) => {
                activeKey.value = key
              }}
              v-slots={{
                labelRender: ({item}: {item: {label?: string; key?: string}}) => (
                    <Flex gap="small">
                      {h(pluginTypeIcon(String(item.key)))}
                      <span>{item.label}</span>
                    </Flex>
                ),
                contentRender: () => {
                  if (type === AI_SERVER_PLUGIN_TARGET_TYPE.MCP) {
                    return (
                        <PluginCard
                            dataSource={mcpDataSource.value}
                            installs={props.installs}
                            workspaces={props.workspaces}
                            targetType={AI_SERVER_PLUGIN_TARGET_TYPE.MCP}
                            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                            onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                            v-slots={{
                              title: ({record}: {record: McpPackageEntity}) => record.name,
                            }}
                        />
                    )
                  }
                  if (type === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL) {
                    return (
                        <PluginCard
                            dataSource={skillDataSource.value}
                            installs={props.installs}
                            workspaces={props.workspaces}
                            targetType={AI_SERVER_PLUGIN_TARGET_TYPE.SKILL}
                            onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                            onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                            v-slots={{
                              title: ({record}: {record: SkillPackageEntity}) => (
                                  <Badge dot={AgentHubService.isPluginOutdated(props.installs, record, AI_SERVER_PLUGIN_TARGET_TYPE.SKILL)}>
                                    {record.name + ' ' + record.latestVersion}
                                  </Badge>
                              ),
                            }}
                        />
                    )
                  }
                  return (
                      <Flex class={`${prefixCls.value}-empty`} justify="center" align="center">
                        <Empty />
                      </Flex>
                  )
                },
              }}
          />
      )
    }
  },
})

export default InstalledPlugins

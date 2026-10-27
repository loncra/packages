import {computed, defineComponent, onMounted, type PropType, ref} from 'vue'
import {Badge, Collapse, Empty, Flex, Skeleton, Space, Tabs, Tag} from 'antdv-next'
import {createFromIconfontCN} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
  getEnumValue,
  type IdValueMetadata,
  ResourceServerService,
  type RestResult,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  type TotalPage,
} from '@loncra/client/commons'
import {
  AI_SERVER_PLUGIN_TARGET_TYPE,
  AiUserPluginInstallService,
  type McpPackageEntity,
  type SkillPackageEntity,
  type UserPluginInstallResult,
} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import SkillReleaseChangeLog from './SkillReleaseChangeLog'
import {AGENT_HUB_PREFIX} from './style'

const IconFont = createFromIconfontCN()

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

function tabIcon(id?: number): string {
  if (id === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL) {
    return 'loncra-sparkles'
  }
  if (id === AI_SERVER_PLUGIN_TARGET_TYPE.MCP) {
    return 'loncra-plug-zap'
  }
  return 'loncra-package'
}

const InstalledPlugins = defineComponent({
  name: 'LAgentHubInstalled',
  props: {
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
  },
  emits: {
    installed: (_result: UserPluginInstallResult) => true,
    uninstalled: (_id: number) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const config = useConfig()
    const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
    const targetTypes = ref<IdValueMetadata<number, string>[]>([])
    const activeKey = ref<string>()
    const install = ref(false)
    const activeType = computed(() => {
      if (activeKey.value == null || activeKey.value === '') {
        return undefined
      }
      return Number(activeKey.value)
    })

    function packagesOf(targetType: number) {
      return props.installs
        .filter((item) => getEnumValue(item.targetType) === targetType)
        .map((item) => item.pluginPackage)
        .filter((item): item is NonNullable<typeof item> => item != null)
    }

    const mcpDataSource = computed(() => toPage(packagesOf(AI_SERVER_PLUGIN_TARGET_TYPE.MCP) as McpPackageEntity[]))
    const skillDataSource = computed(() => toPage(packagesOf(AI_SERVER_PLUGIN_TARGET_TYPE.SKILL) as SkillPackageEntity[]))

    function workspacesOf(record: {id?: number}, targetType: number) {
      if (record.id == null) {
        return []
      }
      return AiUserPluginInstallService.mapInstallsByPackageId(props.installs, targetType).get(record.id)?.workspaces || []
    }

    function workspaceTags(record: {id?: number}, targetType: number) {
      const rows = workspacesOf(record, targetType)
      if (rows.length) {
        return rows
      }
      return [{id: 'all', name: locale.value.workspaceScopeAll}]
    }

    onMounted(async () => {
      install.value = true
      try {
        const result: RestResult<IdValueMetadata<number, string>[]> = await ResourceServerService.getServiceEnumerate(
          SYSTEM_MODULE_NAME.AI_SERVER,
          SYSTEM_ENUM_TYPE.PLUGIN_TARGET_TYPE_ENUM,
        )
        targetTypes.value = result.data || []
        const first = targetTypes.value[0]
        if (first?.id != null) {
          activeKey.value = String(first.id)
        }
      } finally {
        install.value = false
      }
    })

    return () => {
      const type = activeType.value
      return (
        <Skeleton active loading={install.value}>
          <Tabs
            class={`${prefixCls.value}-tabs`}
            activeKey={activeKey.value}
            tabPlacement="start"
            classes={{
              body: `${prefixCls.value}-tabs-body`,
              content: `${prefixCls.value}-tabs-content`,
            }}
            items={targetTypes.value.map((item) => ({label: item.value, key: String(item.id)}))}
            onUpdate:activeKey={(key: string) => {
              activeKey.value = key
            }}
            v-slots={{
              labelRender: ({item}: {item: {label?: string; key?: string}}) => (
                <Flex gap="small">
                  <IconFont type={tabIcon(Number(item.key))} />
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
                      onUninstalled={(id: number) => emit('uninstalled', id)}
                      v-slots={{
                        title: ({record}: {record: McpPackageEntity}) => record.name,
                        after: ({record}: {record: McpPackageEntity}) => (
                          <Space wrap>
                            {workspaceTags(record, AI_SERVER_PLUGIN_TARGET_TYPE.MCP).map((workspace) => (
                              <Tag key={workspace.id}>{workspace.name}</Tag>
                            ))}
                          </Space>
                        ),
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
                      onUninstalled={(id: number) => emit('uninstalled', id)}
                      v-slots={{
                        title: ({record}: {record: SkillPackageEntity}) => (
                          <Badge dot={AiUserPluginInstallService.isSkillOutdated(props.installs, record)}>
                            {record.name} {record.latestVersion}
                          </Badge>
                        ),
                        after: ({record}: {record: SkillPackageEntity}) => (
                          <Flex vertical gap="small">
                            <Space wrap>
                              {workspaceTags(record, AI_SERVER_PLUGIN_TARGET_TYPE.SKILL).map((workspace) => (
                                <Tag key={workspace.id}>{workspace.name}</Tag>
                              ))}
                            </Space>
                            <Collapse
                              ghost
                              class={`${prefixCls.value}-changelog`}
                              items={[{key: 'changelog', label: locale.value.changelog}]}
                              v-slots={{
                                contentRender: () => record.id == null
                                  ? null
                                  : <SkillReleaseChangeLog packageId={record.id} />,
                              }}
                            />
                          </Flex>
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
        </Skeleton>
      )
    }
  },
})

export default InstalledPlugins

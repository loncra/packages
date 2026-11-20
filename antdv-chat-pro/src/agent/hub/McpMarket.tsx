import {computed, defineComponent, type PropType} from 'vue'
import {Flex, Spin, Tabs} from 'antdv-next'
import {ApiOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useIconFontRender} from '@loncra/antdv'
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiMcpPackageService,
    MCP_GROUP_CODE_PREFIX,
    type McpPackageEntity,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import {AGENT_HUB_PREFIX} from './style'
import {useAgentHubPluginMarket} from './useAgentHubPluginMarket.ts'

const McpMarket = defineComponent({
    name: 'LAgentHubMcp',
    props: {
        installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
        workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    },
    emits: {
      installed: (_result: UserPluginInstallResult) => true,
      uninstalled: (_event: UserPluginMetadata) => true,
    },
    setup(props, {emit}) {
        const config = useConfig()
        const iconFontRender = useIconFontRender()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const market = useAgentHubPluginMarket(new AiMcpPackageService(), MCP_GROUP_CODE_PREFIX)

        return () => (
            <Spin spinning={market.install.value} class={`${prefixCls.value}-full-spin`}>
                <Tabs
                    class={`${prefixCls.value}-tabs`}
                    tabPlacement="start"
                    classes={{
                        body: `${prefixCls.value}-tabs-body`,
                        content: `${prefixCls.value}-tabs-content`,
                    }}
                    items={market.groups.value.map((group) => ({
                        label: group.name,
                        key: group.code,
                        metadata: group.metadata,
                    }))}
                    onChange={(key) => market.onTabChange(String(key))}
                    v-slots={{
                        labelRender: ({item}: { item: { label?: string; metadata?: { icon?: string } } }) => (
                            <Flex gap="small">
                                {item.metadata?.icon
                                    ? iconFontRender(item.metadata.icon)
                                    : <ApiOutlined/>}
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => (
                            <Spin spinning={market.loading.value} class={`${prefixCls.value}-full-spin`}>
                                <PluginCard
                                    dataSource={market.dataSource.value}
                                    installs={props.installs}
                                    workspaces={props.workspaces}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.MCP}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void market.loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                                    v-slots={{
                                        title: ({record}: { record: McpPackageEntity }) => record.name,
                                    }}
                                />
                            </Spin>
                        ),
                    }}
                />
            </Spin>
        )
    },
})

export default McpMarket

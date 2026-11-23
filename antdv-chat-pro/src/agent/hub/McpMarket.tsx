import {computed, defineComponent, type PropType} from 'vue'
import {Divider, Flex, Space, Spin, Tabs} from 'antdv-next'
import {ApiOutlined, KeyOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {type KeyValueRow, KeyValueTable, useIconFontRender} from '@loncra/antdv'
import {
    AI_SERVER_API_KEY_MODE,
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiMcpPackageService,
    MCP_GROUP_CODE_PREFIX,
    type McpPackageEntity,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import {AGENT_HUB_PREFIX} from './style'
import {useAgentHubPluginMarket} from './useAgentHubPluginMarket.ts'
import type {Self} from "../types.ts";
import {useLocale} from "../../_util/useLocale.ts";

const McpMarket = defineComponent({
    name: 'LAgentHubMcp',
    props: {
        installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
        self: {type: Object as PropType<Self>, default: undefined},
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
        const locale = useLocale('AgentHub')
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
                                    self={props.self}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.MCP}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void market.loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                                    v-slots={{
                                        title: ({record}: { record: McpPackageEntity }) => record.name,
                                        afterScope: ({form, record}: { form: Record<string, any>; record: unknown }) => {
                                            const pkg = record as McpPackageEntity
                                            if (getEnumValue(pkg.authMode) !== AI_SERVER_API_KEY_MODE.MANUAL) {
                                                return null
                                            }

                                            const items = pkg.metadata?.authConfig?.items ?? []
                                            const position = pkg.metadata?.authConfig?.position
                                            if (items.length === 0 || position === undefined) {
                                                return null
                                            }

                                            form.metadata[position] ??= items.map((item) => ({
                                                id: item.key, key: item.key, value: '', placeholder: item.placeholder, editing: true,
                                            }))
                                            return (
                                                <>
                                                    <Divider title-placement="start" plain>
                                                        <Space>
                                                            <KeyOutlined />
                                                            <span>{locale.value.auth}</span>
                                                        </Space>
                                                    </Divider>
                                                    <KeyValueTable
                                                        addable={false}
                                                        formItemNamePrefix={['metadata', position]}
                                                        columns={{key: {readonly: true, field: 'id'}}}
                                                        value={form.metadata[position] as KeyValueRow[]}
                                                        onUpdate:value={(rows: KeyValueRow[]) => form.metadata[position] = rows}
                                                    />
                                                </>
                                            )
                                        },
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

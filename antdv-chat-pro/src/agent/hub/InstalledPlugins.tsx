import {computed, defineComponent, h, type PropType, ref} from 'vue'
import {Empty, Flex, Tabs, Tag} from 'antdv-next'
import {BankOutlined, FolderOutlined, UserOutlined} from '@antdv-next/icons'
import {pluginTypeIcon} from './constants'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {getEnumValue, type IdValueMetadata, type TotalPage,} from '@loncra/client/commons'
import {
    type McpPackageEntity,
    type PluginInstallGroup,
    type SkillPackageEntity,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import {groupInstallsByPackageId} from './usePluginInstallActions'
import {AGENT_HUB_PREFIX} from './style'
import type {Self} from "../types.ts";

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
        self: {type: Object as PropType<Self>, default: undefined},
        workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
        pluginTypes: {type: Array as PropType<IdValueMetadata<string, string>[]>, default: () => []}
    },
    emits: {
        installed: (_result: UserPluginInstallResult) => true,
        uninstalled: (_event: UserPluginMetadata) => true,
    },
    setup(props, {emit}) {
        const config = useConfig()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const activeKey = ref<string>()
        if (props.pluginTypes.length > 0) {
            activeKey.value = props.pluginTypes.at(0)?.id
        }

        function packagesOf(targetType: string | undefined) {
            if (!targetType) {
                return []
            }
            const packages = new Map<number, NonNullable<UserPluginInstallResult['pluginPackage']>>()
            for (const item of props.installs) {
                if (getEnumValue(item.targetType) !== targetType || item.pluginPackage?.id == null) {
                    continue
                }
                packages.set(item.pluginPackage.id, item.pluginPackage)
            }
            return [...packages.values()]
        }

        const dataSource = computed(() => toPage(packagesOf(activeKey.value) as SkillPackageEntity[]))
        const installGroups = computed(() =>
            activeKey.value
                ? groupInstallsByPackageId(props.installs, activeKey.value)
                : new Map<number, PluginInstallGroup>(),
        )
        const SCOPE_TAG_META = {
            enterprise: {color: 'warning', icon: BankOutlined},
            personal: {color: 'success', icon: UserOutlined},
            workspace: {color: 'default', icon: FolderOutlined},
        } as const
        type ScopeTagType = keyof typeof SCOPE_TAG_META

        function scopeTagTypeOf(recordId: number | undefined): ScopeTagType {
            const group = recordId == null ? undefined : installGroups.value.get(recordId)
            if (group?.enterprise != null) {
                return 'enterprise'
            }
            if (group?.userAll != null) {
                return 'personal'
            }
            return 'workspace'
        }

        return () => {
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
                    onUpdate:activeKey={(key: string) => activeKey.value = key}
                    v-slots={{
                        labelRender: ({item}: { item: { label?: string; key?: string } }) => (
                            <Flex gap="small">
                                {h(pluginTypeIcon(String(item.key)))}
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => {
                            if (activeKey.value) {
                                return (
                                    <PluginCard
                                        dataSource={dataSource.value}
                                        installs={props.installs}
                                        self={props.self}
                                        workspaces={props.workspaces}
                                        targetType={activeKey.value}
                                        onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                        onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                                        v-slots={{
                                            title: ({record}: { record: McpPackageEntity }) => {
                                                const meta = SCOPE_TAG_META[scopeTagTypeOf(record.id)]
                                                return (
                                                    <Tag color={meta.color} icon={<meta.icon />}>{record.name}</Tag>
                                                )
                                            },
                                        }}
                                    />
                                )
                            }
                            return (
                                <Flex class={`${prefixCls.value}-empty`} justify="center" align="center">
                                    <Empty/>
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

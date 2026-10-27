import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Collapse, Flex, Skeleton, Spin, Tabs} from 'antdv-next'
import {StarOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiSkillPackageService,
    AiUserPluginInstallService,
    SKILL_GROUP_CODE_PREFIX,
    type SkillPackageEntity,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import {iconFontNode} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import SkillReleaseChangeLog from './SkillReleaseChangeLog'
import {AGENT_HUB_PREFIX} from './style'
import {useAgentHubMarket} from './useAgentHubMarket'

const SkillMarket = defineComponent({
    name: 'LAgentHubSkill',
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
        const market = useAgentHubMarket(new AiSkillPackageService(), SKILL_GROUP_CODE_PREFIX)

        return () => (
            <Skeleton active loading={market.install.value}>
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
                                {item.metadata?.icon ? iconFontNode(item.metadata.icon) : <StarOutlined/>}
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => (
                            <Spin spinning={market.loading.value} class={`${prefixCls.value}-full-spin`}>
                                <PluginCard
                                    dataSource={market.dataSource.value}
                                    installs={props.installs}
                                    workspaces={props.workspaces}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.SKILL}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void market.loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(id: number) => emit('uninstalled', id)}
                                    v-slots={{
                                        title: ({record}: { record: SkillPackageEntity }) => (
                                            <Badge
                                                dot={AiUserPluginInstallService.isSkillOutdated(props.installs, record)}>
                                                {record.name} {record.latestVersion}
                                            </Badge>
                                        ),
                                        after: ({record}: { record: SkillPackageEntity }) => (
                                            <Collapse
                                                ghost
                                                class={`${prefixCls.value}-changelog`}
                                                items={[{key: 'changelog', label: locale.value.changelog}]}
                                                v-slots={{
                                                    contentRender: () => record.id == null
                                                        ? null
                                                        : <SkillReleaseChangeLog packageId={record.id}/>,
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </Spin>
                        ),
                    }}
                />
            </Skeleton>
        )
    }
})

export default SkillMarket

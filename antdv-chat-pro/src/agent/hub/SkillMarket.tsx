import {computed, defineComponent, type PropType, ref} from 'vue'
import {Collapse, Flex, Spin, Tabs, Typography} from 'antdv-next'
import {StarOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiSkillPackageService,
    SKILL_GROUP_CODE_PREFIX,
    type SkillPackageEntity,
    type SkillReleaseEntity,
    type UpdatePolicyUserPluginInstallMetadata,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {useIconFontRender} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import SkillReleaseChangeLog from './SkillReleaseChangeLog'
import {AGENT_HUB_PREFIX} from './style'
import {useAgentHubPluginMarket} from './useAgentHubPluginMarket.ts'
import type {Self} from "../types.ts";

const SkillMarket = defineComponent({
    name: 'LAgentHubSkill',
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
        const locale = useLocale('AgentHub')
        const config = useConfig()
        const iconFontRender = useIconFontRender()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const market = useAgentHubPluginMarket(new AiSkillPackageService(), SKILL_GROUP_CODE_PREFIX)
        const releaseTarget = ref<SkillReleaseEntity>()

        function renderReleaseChangeLog(
            record: SkillPackageEntity | undefined,
            onReleaseChange?: (release: SkillReleaseEntity) => void,
        ) {
            const packageId = record?.id
            return packageId == null
                ? null
                : (
                    <Collapse
                        ghost
                        class={`${prefixCls.value}-changelog`}
                        items={[{key: 'changelog', label: locale.value.changelog}]}
                        v-slots={{
                            contentRender: () => (
                                <SkillReleaseChangeLog packageId={packageId} onChange={onReleaseChange}/>
                            ),
                        }}
                    />
                )
        }

        function findInstall(record: SkillPackageEntity, workspace: AgentConversationRecord): UserPluginInstallResult | undefined {
            return props.installs.find((item) =>
                item.pluginPackage?.id === record.id
                && getEnumValue(item.targetType) === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL
                && item.workspace?.id === workspace.id,
            )
        }

        function renderLockedVersion(install: UserPluginInstallResult, target: string | undefined) {
            const locked = (install.metadata as UpdatePolicyUserPluginInstallMetadata).releaseVersion
            const upgrade = Boolean(target) && Boolean(locked) && locked !== target
            return (
                <Typography.Text type={upgrade ? 'warning' : 'secondary'}>
                    {upgrade ? `${locked} → ${target}` : (locked ?? '')}
                </Typography.Text>
            )
        }

        function renderVersion(workspace: AgentConversationRecord, record: SkillPackageEntity | undefined) {
            if (record?.id == null) {
                return null
            }
            const install = findInstall(record, workspace)
            const target = releaseTarget.value?.releaseVersion ?? record.latestVersion
            if (install == null) {
                return target == null
                    ? null
                    : <Typography.Text type="secondary">{target}</Typography.Text>
            }
            return renderLockedVersion(install, target)
        }

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
                                {item.metadata?.icon ? iconFontRender(item.metadata.icon) : <StarOutlined/>}
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => (
                            <Spin spinning={market.loading.value} class={`${prefixCls.value}-full-spin`}>
                                <PluginCard
                                    dataSource={market.dataSource.value}
                                    installs={props.installs}
                                    self={props.self}
                                    workspaces={props.workspaces}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.SKILL}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void market.loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(event: UserPluginMetadata) => emit('uninstalled', event)}
                                    v-slots={{
                                        title: ({record}: { record: SkillPackageEntity }) => record.name,
                                        after: ({record}: { record: SkillPackageEntity }) => renderReleaseChangeLog(record),
                                        afterModalScope: ({record}: { record: unknown }) => renderReleaseChangeLog(
                                            record as SkillPackageEntity | undefined,
                                            (release) => {
                                                releaseTarget.value = release
                                            },
                                        ),
                                        workspaceItemExtra: ({workspace, record}: { workspace: AgentConversationRecord; record: unknown }) => (
                                            renderVersion(workspace, record as SkillPackageEntity | undefined)
                                        ),
                                    }}
                                />
                            </Spin>
                        ),
                    }}
                />
            </Spin>
        )
    }
})

export default SkillMarket

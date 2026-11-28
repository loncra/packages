import {computed, defineComponent, type PropType} from 'vue'
import {Flex, FormItem, Spin, Tabs} from 'antdv-next'
import {StarOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiSkillPackageService,
    type PluginInstallGroup,
    SKILL_GROUP_CODE_PREFIX,
    type SkillPackageEntity,
    type UpdatePolicyUserPluginInstallMetadata,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {useIconFontRender, VersionSelect} from '@loncra/antdv'
import {useLocale} from '../../../_util/useLocale'
import PluginCard from '../card/PluginCard'
import type {AgentConversationRecord} from '../../conversation'
import {ensureReleases, releaseOptionsOf} from './useReleases'
import useStyle, {AGENT_HUB_MARKET_PREFIX} from './style'
import {useAgentHubPluginMarket} from './useAgentHubPluginMarket.ts'
import {useSkillChangelog} from './useSkillChangelog.tsx'
import type {Self} from '../../types.ts'

type HubModalScopeCtx = {
    record: unknown
    form?: {metadata: Record<string, unknown>; ownership: number; workspaceScope: number; workspaceVersions?: Record<string, string>}
    group?: PluginInstallGroup
    submit?: () => Promise<void>
}

type HubWorkspaceExtraCtx = {
    workspace: AgentConversationRecord
    record: unknown
    form?: {workspaces: string[]; workspaceVersions?: Record<string, string>}
    group?: PluginInstallGroup
}

function allRowOf(group: PluginInstallGroup | undefined, ownership: number): UserPluginInstallResult | undefined {
    if (group == null) {
        return undefined
    }
    return ownership === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE ? group.enterprise : group.userAll
}

const SkillMarket = defineComponent({
    name: 'LAgentHubSkillMarket',
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
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub-market', AGENT_HUB_MARKET_PREFIX))
        useStyle(prefixCls)
        const market = useAgentHubPluginMarket(new AiSkillPackageService(), SKILL_GROUP_CODE_PREFIX)
        const {renderReleaseChangeLog} = useSkillChangelog()

        function findInstall(record: SkillPackageEntity, workspace: AgentConversationRecord): UserPluginInstallResult | undefined {
            return props.installs.find((item) =>
                item.pluginPackage?.id === record.id
                && getEnumValue(item.targetType) === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL
                && item.workspace?.id === workspace.id,
            )
        }

        function lockedVersionOf(install: UserPluginInstallResult): string | undefined {
            return (install.metadata as UpdatePolicyUserPluginInstallMetadata).releaseVersion
        }

        function setWorkspaceVersion(
            form: {workspaceVersions?: Record<string, string>},
            workspaceId: string,
            version: string,
        ): void {
            form.workspaceVersions = {...(form.workspaceVersions ?? {}), [workspaceId]: version}
        }

        function renderVersionFormItem(
            form: NonNullable<HubModalScopeCtx['form']>,
            record: SkillPackageEntity,
            row: UserPluginInstallResult | undefined,
            submit: () => Promise<void>,
        ) {
            if (record.id == null) {
                return null
            }
            void ensureReleases(record.id)
            const locked = row == null ? undefined : lockedVersionOf(row)
            return (
                <FormItem
                    label={locale.value.version}
                    layout="horizontal"
                    labelAlign="left"
                    labelCol={{flex: 'auto'}}
                    wrapperCol={{flex: 'auto'}}
                >
                    <Flex justify="flex-end">
                        <VersionSelect
                            value={(form.metadata.releaseVersion as string | undefined) ?? locked}
                            options={releaseOptionsOf(record.id)}
                            onChange={(version: string) => {
                                form.metadata.releaseVersion = version
                            }}
                            onUpgrade={(latest: string) => {
                                form.metadata.releaseVersion = latest
                                void submit()
                            }}
                        />
                    </Flex>
                </FormItem>
            )
        }

        function renderManagedVersion(
            form: NonNullable<HubWorkspaceExtraCtx['form']>,
            record: SkillPackageEntity,
            install: UserPluginInstallResult,
            workspaceId: string,
        ) {
            if (record.id == null) {
                return null
            }
            void ensureReleases(record.id)
            return (
                <VersionSelect
                    value={form.workspaceVersions?.[workspaceId] ?? lockedVersionOf(install)}
                    options={releaseOptionsOf(record.id)}
                    disabled={!form.workspaces.includes(workspaceId)}
                    onChange={(version: string) => {
                        setWorkspaceVersion(form, workspaceId, version)
                    }}
                    onUpgrade={(latest: string) => {
                        setWorkspaceVersion(form, workspaceId, latest)
                    }}
                />
            )
        }

        function renderInstallSelect(
            form: NonNullable<HubWorkspaceExtraCtx['form']>,
            record: SkillPackageEntity,
            workspace: AgentConversationRecord,
        ) {
            if (record.id == null) {
                return null
            }
            void ensureReleases(record.id)
            const workspaceId = String(workspace.id)
            return (
                <VersionSelect
                    value={form.workspaceVersions?.[workspaceId]}
                    options={releaseOptionsOf(record.id)}
                    disabled={!form.workspaces.includes(workspaceId)}
                    onChange={(version: string) => {
                        setWorkspaceVersion(form, workspaceId, version)
                    }}
                />
            )
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
                                        afterModalScope: ({form, record, group, submit}: HubModalScopeCtx) => {
                                            const skillRecord = record as SkillPackageEntity | undefined
                                            if (skillRecord?.id == null || form == null) {
                                                return null
                                            }
                                            const allScope = form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
                                            const allRow = allScope ? allRowOf(group, form.ownership) : undefined
                                            return (
                                                <>
                                                    {allScope
                                                        //&& (group == null || allRow != null)
                                                        ? renderVersionFormItem(
                                                            form,
                                                            skillRecord,
                                                            allRow,
                                                            submit ?? (() => Promise.resolve()),
                                                        )
                                                        : null}
                                                    {renderReleaseChangeLog(skillRecord)}
                                                </>
                                            )
                                        },
                                        workspaceItemExtra: ({workspace, record, form, group}: HubWorkspaceExtraCtx) => {
                                            const skillRecord = record as SkillPackageEntity | undefined
                                            const install = skillRecord?.id == null ? undefined : findInstall(skillRecord, workspace)
                                            if (skillRecord?.id == null || form == null) {
                                                return null
                                            }
                                            if (group != null && install != null) {
                                                return renderManagedVersion(form, skillRecord, install, String(workspace.id))
                                            }
                                            return renderInstallSelect(form, skillRecord, workspace)
                                        },
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

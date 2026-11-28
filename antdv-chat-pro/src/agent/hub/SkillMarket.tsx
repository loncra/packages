import {computed, defineComponent, type PropType, ref} from 'vue'
import {
    Badge,
    Button,
    Collapse,
    Flex,
    FormItem,
    Select,
    SpaceAddon,
    SpaceCompact,
    Spin,
    Tabs,
    Tooltip,
    Typography
} from 'antdv-next'
import {ArrowUpOutlined, StarOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiSkillPackageService,
    type PluginInstallGroup,
    SKILL_GROUP_CODE_PREFIX,
    type SkillPackageEntity,
    type SkillReleaseEntity,
    type UpdatePolicyUserPluginInstallMetadata,
    type UserPluginInstallResult,
    type UserPluginMetadata,
} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {classNames, useIconFontRender} from '@loncra/antdv'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import SkillReleaseChangeLog from './SkillReleaseChangeLog'
import useStyle, {AGENT_HUB_PREFIX} from './style'
import {useAgentHubPluginMarket} from './useAgentHubPluginMarket.ts'
import type {Self} from "../types.ts";

type HubModalScopeCtx = {
    record: unknown
    form?: {metadata: Record<string, unknown>; ownership: number; workspaceScope: number; workspaceVersions?: Record<string, string>}
    group?: PluginInstallGroup
    submit?: () => Promise<void>
}

const releaseCache = ref(new Map<number, SkillReleaseEntity[]>())
const releasePending = ref(new Map<number, Promise<void>>())
const releaseService = new AiSkillPackageService()

function ensureReleases(packageId: number): Promise<void> {
    if (releaseCache.value.has(packageId)) {
        return Promise.resolve()
    }
    const pending = releasePending.value.get(packageId)
    if (pending != null) {
        return pending
    }
    const promise = releaseService.listReleases(packageId)
        .then((result) => {
            releaseCache.value = new Map(releaseCache.value).set(packageId, result.data ?? [])
        })
        .finally(() => {
            const next = new Map(releasePending.value)
            next.delete(packageId)
            releasePending.value = next
        })
    releasePending.value = new Map(releasePending.value).set(packageId, promise)
    return promise
}

function releaseOptionsOf(packageId: number): {label: string; value: string}[] {
    return (releaseCache.value.get(packageId) ?? [])
        .filter((item) => item.releaseVersion != null)
        .map((item) => ({label: item.releaseVersion!, value: item.releaseVersion!}))
}

const ReleaseVersionSelect = defineComponent({
    name: 'LAgentHubSkillReleaseVersionSelect',
    props: {
        packageId: {type: Number, required: true},
        value: {type: String, default: undefined},
        locked: {type: String, default: undefined},
        latest: {type: String, default: undefined},
        disabled: {type: Boolean, default: false},
    },
    emits: {
        change: (_version: string) => true,
        upgrade: (_latest: string) => true,
    },
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const config = useConfig()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const [hashId] = useStyle(prefixCls)
        const options = computed(() => {
            void ensureReleases(props.packageId)
            return releaseOptionsOf(props.packageId)
        })
        const outdated = computed(() =>
            props.locked != null && props.latest != null && props.locked !== props.latest)
        return () => (
            <Badge dot={outdated.value}>
                <SpaceCompact size="small">
                    <Select
                        class={classNames(hashId.value, `${prefixCls.value}-version-select`)}
                        value={props.value ?? props.locked ?? props.latest}
                        options={options.value}
                        disabled={props.disabled}
                        onChange={(version: string) => emit('change', version)}
                    />
                    {outdated.value
                        ? (
                            <>
                                <SpaceAddon>{" → "}</SpaceAddon>
                                <SpaceAddon>
                                    <Typography.Text type="warning">
                                        {(props.latest ?? '')}
                                    </Typography.Text>
                                </SpaceAddon>
                                <Tooltip title={locale.value.upgrade}>
                                    <Button
                                        type="primary"
                                        onClick={() => emit('upgrade', props.latest ?? '')}
                                        v-slots={{icon: () => <ArrowUpOutlined/>}}
                                    />
                                </Tooltip>
                            </>
                        )
                        : null}
                </SpaceCompact>
            </Badge>
        )
    },
})

type HubWorkspaceExtraCtx = {
    workspace: AgentConversationRecord
    record: unknown
    form?: {workspaces: string[]; workspaceVersions?: Record<string, string>}
    group?: PluginInstallGroup
}

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
        const [hashId] = useStyle(prefixCls)
        const market = useAgentHubPluginMarket(new AiSkillPackageService(), SKILL_GROUP_CODE_PREFIX)

        const changelogOpenKeys = ref(new Map<number, string[]>())

        function toggleChangelog(packageId: number, keys: string[]): void {
            changelogOpenKeys.value = new Map(changelogOpenKeys.value).set(packageId, keys)
            if (keys.includes('changelog')) {
                void ensureReleases(packageId)
            }
        }

        function renderReleaseChangeLog(record: SkillPackageEntity | undefined) {
            const packageId = record?.id
            if (packageId == null) {
                return null
            }
            return (
                <Collapse
                    ghost
                    class={`${prefixCls.value}-changelog`}
                    activeKey={changelogOpenKeys.value.get(packageId) ?? []}
                    onChange={(keys: string[]) => toggleChangelog(packageId, keys)}
                    items={[{key: 'changelog', label: locale.value.changelog}]}
                    v-slots={{
                        contentRender: () => (
                            <SkillReleaseChangeLog
                                dataSource={releaseCache.value.get(packageId) ?? []}
                                loading={!releaseCache.value.has(packageId)}
                            />
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

        function renderInstallVersionFormItem(form: NonNullable<HubModalScopeCtx['form']>, record: SkillPackageEntity) {
            if (record.id == null) {
                return null
            }
            return (
                <FormItem
                    label={locale.value.version}
                    layout="horizontal"
                    labelAlign="left"
                    labelCol={{flex: 'auto'}}
                    wrapperCol={{flex: 'auto'}}
                >
                    <Flex justify="flex-end">
                        <ReleaseVersionSelect
                            class={classNames(hashId.value, `${prefixCls.value}-version-select`)}
                            packageId={record.id}
                            value={(form.metadata.releaseVersion as string | undefined) ?? record.latestVersion}
                            onChange={(value: string) => {
                                form.metadata.releaseVersion = value
                            }}
                        />
                    </Flex>
                </FormItem>
            )
        }

        function renderAllVersionFormItem(
            form: NonNullable<HubModalScopeCtx['form']>,
            record: SkillPackageEntity,
            row: UserPluginInstallResult,
            submit: () => Promise<void>,
        ) {
            if (record.id == null) {
                return null
            }
            return (
                <FormItem
                    label={locale.value.version}
                    layout="horizontal"
                    labelAlign="left"
                    labelCol={{flex: 'auto'}}
                    wrapperCol={{flex: 'auto'}}
                >
                    <Flex justify="flex-end">
                        <ReleaseVersionSelect
                            class={classNames(hashId.value, `${prefixCls.value}-version-select`)}
                            packageId={record.id}
                            value={(form.metadata.releaseVersion as string | undefined) ?? lockedVersionOf(row)}
                            locked={lockedVersionOf(row)}
                            latest={record.latestVersion}
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
            return (
                <ReleaseVersionSelect
                    class={classNames(hashId.value, `${prefixCls.value}-version-select`)}
                    packageId={record.id}
                    value={form.workspaceVersions?.[workspaceId] ?? lockedVersionOf(install)}
                    locked={lockedVersionOf(install)}
                    latest={record.latestVersion}
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
            const workspaceId = String(workspace.id)
            return (
                <ReleaseVersionSelect
                    class={classNames(hashId.value, `${prefixCls.value}-version-select`)}
                    packageId={record.id}
                    disabled={!form.workspaces.includes(workspaceId)}
                    value={form.workspaceVersions?.[workspaceId] ?? record.latestVersion ?? undefined}
                    onChange={(value: string) => {
                        setWorkspaceVersion(form, workspaceId, value)
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
                                            if (skillRecord?.id == null) {
                                                return null
                                            }
                                            const allRow = group != null && form != null
                                                ? (form.ownership === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE
                                                    ? group.enterprise
                                                    : group.userAll)
                                                : undefined
                                            return (
                                                <>
                                                    {form != null
                                                        && form.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
                                                        ? (group == null
                                                            ? renderInstallVersionFormItem(form, skillRecord)
                                                            : allRow != null
                                                                ? renderAllVersionFormItem(form, skillRecord, allRow, submit ?? (() => Promise.resolve()))
                                                                : null)
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

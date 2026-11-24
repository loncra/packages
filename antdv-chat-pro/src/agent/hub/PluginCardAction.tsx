import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Button, Space, SpaceCompact, Tooltip, Typography} from 'antdv-next'
import {DeleteOutlined, DownloadOutlined, SettingOutlined} from '@antdv-next/icons'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import {type PluginInstallGroup, type UserPluginInstallResult,} from '@loncra/client/ai'
import {pluginInstallStatusBadge} from './constants'
import type {WorkspaceMeta} from './usePluginInstallActions'
import {
    findPendingInstall,
    groupInstallsByPackageId,
    isPluginOutdated,
    isRecordUpgradeable
} from './usePluginInstallActions'
import type {AgentConversationRecord} from '../conversation'
import type {Self} from '../types'
import type {PluginCardRecord} from './types.ts'

const PluginCardAction = defineComponent({
    name: 'LAgentHubPluginCardAction',
    props: {
        record: {type: Object as PropType<PluginCardRecord>, required: true},
        installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
        workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
        self: {type: Object as PropType<Self>, default: undefined},
        targetType: {type: String, required: true},
    },
    emits: {
        install: () => true,
        manage: (_group?: PluginInstallGroup) => true,
        uninstall: (_selected: WorkspaceMeta[]) => true,
    },
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const isOrgOwner = computed(() =>
            props.self?.type === AUTH_SERVER_AUTHENTICATION_TYPE.ENTERPRISE
            && (props.self?.authorities ?? []).includes('ROLE_ENTERPRISE_OWNER'),
        )

        const group = computed(() =>
            props.record.id == null
                ? undefined
                : groupInstallsByPackageId(props.installs, props.targetType).get(props.record.id),
        )

        function isUpgradePending(): boolean {
            return isRecordUpgradeable(props.record)
                && isPluginOutdated(props.installs, props.record, props.targetType)
        }

        const pendingRow = computed(() => findPendingInstall(group.value))

        function renderInstallButton() {
            return (
                <Tooltip title={locale.value.install}>
                    <Button
                        size="small"
                        type="primary"
                        onClick={() => emit('install')}
                        v-slots={{icon: () => <DownloadOutlined/>}}
                    >
                    </Button>
                </Tooltip>
            )
        }

        function renderUninstallButton() {
            const selected = (group.value?.workspaces ?? [])
                .map((item) => item.workspace)
                .filter((item): item is WorkspaceMeta => item != null)
            return (
                <Tooltip title={locale.value.uninstall}>
                    <Button
                        danger
                        size="small"
                        type="primary"
                        onClick={() => emit('uninstall', selected)}
                        v-slots={{icon: () => <DeleteOutlined/>}}
                    >
                    </Button>
                </Tooltip>
            )
        }

        function renderPendingBadge() {
            const row = pendingRow.value
            if (row == null || row.status == null || typeof row.status === 'number') {
                return null
            }
            return (
                <Tooltip title={row.exception}>
                    <Badge status={pluginInstallStatusBadge(row.status)} text={row.status.name}/>
                </Tooltip>
            )
        }

        function renderManageButton() {
            return (
                <Badge dot={isUpgradePending()}>
                    <Button size="small" onClick={() => emit('manage', group.value)} v-slots={{icon: () => <SettingOutlined/>}}/>
                </Badge>
            )
        }

        return () => {
            if (group.value == null) {
                return renderInstallButton()
            }
            if (group.value.enterprise != null && !isOrgOwner.value) {
                return <Typography.Text type="success">{locale.value.installed}</Typography.Text>
            }
            return (
                <Space align="center">
                    {renderPendingBadge()}
                    <SpaceCompact>
                        {renderManageButton()}
                        {renderUninstallButton()}
                    </SpaceCompact>
                </Space>
            )
        }
    },
})

export default PluginCardAction

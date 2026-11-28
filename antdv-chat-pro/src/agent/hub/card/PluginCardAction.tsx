import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Button, Space, Tooltip, Typography} from 'antdv-next'
import {CloudServerOutlined, DownloadOutlined, SettingOutlined, ShopOutlined} from '@antdv-next/icons'
import {AuthServerService} from '@loncra/client/auth'
import {
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    type PluginInstallGroup,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import {useLocale} from '../../../_util/useLocale'
import {pluginInstallStatusBadge} from '../hubKinds'
import {
    findPendingInstall,
    groupInstallsByPackageId,
    hasInstallForScope,
    isUpgradePending,
} from './usePluginInstallActions'
import type {AgentConversationRecord} from '../../conversation'
import type {Self} from '../../types'
import type {PluginCardRecord} from '../types'

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
        installOwnership: (_ownership: number) => true,
        manage: (_group?: PluginInstallGroup) => true,
    },
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const isOrgOwner = computed(() => AuthServerService.isEnterpriseOwner(props.self))

        const group = computed(() =>
            props.record.id == null
                ? undefined
                : groupInstallsByPackageId(props.installs, props.targetType).get(props.record.id),
        )

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
                <Badge dot={isUpgradePending(group.value, props.record)}>
                    <Button size="small" onClick={() => emit('manage', group.value)} v-slots={{icon: () => <SettingOutlined/>}}/>
                </Badge>
            )
        }

        function renderOwnershipButton(ownership: number) {
            const personal = ownership === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER

            const Icon = personal ? CloudServerOutlined : ShopOutlined
            return (
                <Button
                    size="small"
                    onClick={() => emit('installOwnership', ownership)}
                    v-slots={{icon: () => <Icon/>}}
                >
                    {personal ? locale.value.installForPersonal : locale.value.installForEnterprise}
                </Button>
            )
        }

        return () => {
            if (group.value == null) {
                return renderInstallButton()
            }
            const missingPersonal = !hasInstallForScope(group.value, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER)
            if (hasInstallForScope(group.value, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE) && !isOrgOwner.value) {
                return (
                    <Space align="center">
                        <Typography.Text type="success">{locale.value.installed}</Typography.Text>
                        {missingPersonal ? renderOwnershipButton(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER) : null}
                    </Space>
                )
            }
            return (
                <Space align="center">
                    {renderPendingBadge()}
                    {missingPersonal ? renderOwnershipButton(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER) : null}
                    {isOrgOwner.value && !hasInstallForScope(group.value, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE)
                        ? renderOwnershipButton(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE)
                        : null}
                    {renderManageButton()}
                </Space>
            )
        }
    },
})

export default PluginCardAction

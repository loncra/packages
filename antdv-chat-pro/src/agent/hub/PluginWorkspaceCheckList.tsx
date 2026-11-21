import {computed, defineComponent, type PropType, ref} from 'vue'
import {Button, Checkbox, Flex, SpaceCompact, Typography, TypographyText} from 'antdv-next'
import {ArrowUpOutlined, DeleteOutlined, FolderOpenOutlined, FolderOutlined, PlusOutlined} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, fillLocale} from '@loncra/antdv'
import {getEnumValue} from '@loncra/client/commons'
import {type UpdatePolicyUserPluginInstallMetadata, type UserPluginInstallResult} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import {isDefaultWorkspace} from '../conversation/useAgentConversations'
import type {AgentConversationRecord} from '../conversation'
import type {WorkspaceMeta} from './usePluginInstallActions'
import useStyle, {AGENT_HUB_PREFIX} from './style'

const PluginWorkspaceCheckList = defineComponent({
    name: 'LAgentHubWorkspaceCheckList',
    props: {
        installs: {type: Array as PropType<UserPluginInstallResult[]>, required: true},
        conversationWorkspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
        latestVersion: {type: String, default: undefined},
        showAddButton: {type: Boolean, default: false},
    },
    emits: {
        uninstall: (_selected: WorkspaceMeta[]) => true,
        addWorkspace: () => true,
        upgrade: (_selected: WorkspaceMeta[]) => true,
    },
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const config = useConfig()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const [hashId] = useStyle(prefixCls)
        const checked = ref<WorkspaceMeta[]>([])
        const lockedOf = (install: UserPluginInstallResult): string | undefined =>
            (install.metadata as UpdatePolicyUserPluginInstallMetadata).releaseVersion
        const workspaceRows = computed(() =>
            props.installs.map((install) => {
                const workspace = install.workspace!
                const locked = lockedOf(install)
                return {
                    workspace,
                    id: workspace.id,
                    name: workspace.name,
                    locked,
                    upgrade: props.latestVersion != null
                        && Boolean(locked) && locked !== props.latestVersion,
                }
            }),
        )
        const selectedRows = computed(() =>
            workspaceRows.value.filter(row => checked.value.includes(row.workspace)),
        )
        const selectedOutdated = computed(() => selectedRows.value.filter(row => row.upgrade))
        const hasUpgradable = computed(() => workspaceRows.value.some(row => row.upgrade))

        function toggle(workspace: WorkspaceMeta, value: boolean): void {
            checked.value = value
                ? [...checked.value, workspace]
                : checked.value.filter(item => item.id !== workspace.id)
        }

        return () => {
            const cls = (name: string) => `${prefixCls.value}-${name}`

            function renderIcon(workspace: WorkspaceMeta) {
                const workspaceRecord = props.conversationWorkspaces.find(item => String(item.id) === workspace.id)
                const Icon = workspaceRecord && isDefaultWorkspace(getEnumValue(workspaceRecord.type))
                    ? FolderOpenOutlined
                    : FolderOutlined
                return (
                    <Icon
                        class={classNames(
                            hashId.value,
                            workspaceRecord?.tone ? `${prefixCls.value}-${workspaceRecord.tone}` : undefined,
                        )}
                    />
                )
            }

            function renderVersion(row: { locked?: string, upgrade: boolean }) {
                if (props.latestVersion == null) {
                    return null
                }
                return (
                    <Typography.Text type={row.upgrade ? 'warning' : 'secondary'} class={cls('version')}>
                        {row.upgrade ? `${row.locked} → ${props.latestVersion}` : `${row.locked ?? ''}`}
                    </Typography.Text>
                )
            }

            const rows = workspaceRows.value.map((row) => (
                <Flex key={row.id} align="center" justify="space-between" gap="small" class={cls('popover-row')}>
                  <Flex gap="small" >
                    <Checkbox
                        checked={checked.value.includes(row.workspace)}
                        onChange={(e: { target: { checked: boolean } }) => toggle(row.workspace, e.target.checked)}
                    />
                    {renderIcon(row.workspace)}
                    <TypographyText ellipsis>{row.name}</TypographyText>
                  </Flex>
                  {renderVersion(row)}
                </Flex>
            ))
            return (
                <Flex vertical gap="small">
                    {rows}
                    <SpaceCompact block>
                        <Button
                            size="small"
                            type="primary"
                            block
                            danger
                            disabled={checked.value.length === 0}
                            onClick={() => {
                                emit('uninstall', checked.value)
                                checked.value = []
                            }}
                            v-slots={{icon: () => <DeleteOutlined/>}}
                        >
                            {locale.value.uninstallSelected}
                        </Button>
                        {hasUpgradable.value
                            ? (
                                <Button
                                    block
                                    size="small"
                                    type="primary"
                                    disabled={selectedOutdated.value.length < 1}
                                    onClick={() => {
                                        emit('upgrade', selectedOutdated.value.map(row => row.workspace))
                                        checked.value = []
                                    }}
                                    v-slots={{icon: () => <ArrowUpOutlined/>}}
                                >
                                    {fillLocale(locale.value.upgradeSelected, {count: selectedOutdated.value.length})}
                                </Button>
                            )
                            : null}
                        {props.showAddButton
                            ? (
                                <Button
                                    block
                                    size="small"
                                    onClick={() => emit('addWorkspace')}
                                    v-slots={{icon: () => <PlusOutlined/>}}
                                >
                                    {locale.value.addWorkspace}
                                </Button>
                            )
                            : null}
                    </SpaceCompact>
                </Flex>
            )
        }
    },
})

export default PluginWorkspaceCheckList

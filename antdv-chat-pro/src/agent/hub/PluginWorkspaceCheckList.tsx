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
    const selected = computed(() =>
      checked.value.filter(ws => props.installs.some(item => item.workspace?.id === ws.id)),
    )
    const selectedOutdated = computed(() =>
      selected.value.filter((ws) => {
        const install = props.installs.find(item => item.workspace?.id === ws.id)
        return install != null && props.latestVersion != null
          && Boolean(lockedOf(install)) && lockedOf(install) !== props.latestVersion
      }),
    )

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

      function renderVersion(install: UserPluginInstallResult) {
        if (props.latestVersion == null) {
          return null
        }
        const locked = lockedOf(install)
        const outdated = Boolean(locked) && locked !== props.latestVersion
        return (
          <Typography.Text type={outdated ? 'warning' : 'secondary'} class={cls('version')}>
            {outdated ? `${locked} → ${props.latestVersion}` : `${locked ?? ''}`}
          </Typography.Text>
        )
      }

      const rows = props.installs.map((install) => {
        const workspace = install.workspace!
        return (
          <Flex key={workspace.id} align="center" justify="space-between" gap="small" class={cls('popover-row')}>
            <Flex gap="small" >
              <Checkbox
                checked={selected.value.some(item => item.id === workspace.id)}
                onChange={(e: {target: {checked: boolean}}) => toggle(workspace, e.target.checked)}
              />
              {renderIcon(workspace)}
              <TypographyText ellipsis>{workspace.name}</TypographyText>
            </Flex>
            {renderVersion(install)}
          </Flex>
        )
      })
      return (
        <Flex vertical gap="small">
          {rows}
          <SpaceCompact block>
            <Button
              size="small"
              type="primary"
              danger
              disabled={selected.value.length === 0}
              onClick={() => {
                emit('uninstall', selected.value)
                checked.value = []
              }}
              v-slots={{icon: () => <DeleteOutlined />}}
            >
              {locale.value.uninstallSelected}
            </Button>
            {props.showAddButton
              ? (
                <Button
                  size="small"
                  type="primary"
                  onClick={() => emit('addWorkspace')}
                  v-slots={{icon: () => <PlusOutlined />}}
                >
                  {locale.value.addWorkspace}
                </Button>
              )
              : null}
          </SpaceCompact>
          {props.latestVersion != null && selectedOutdated.value.length > 0
            ? (
              <Button
                size="small"
                type="primary"
                block
                onClick={() => {
                  emit('upgrade', selectedOutdated.value)
                  checked.value = []
                }}
                v-slots={{icon: () => <ArrowUpOutlined />}}
              >
                {fillLocale(locale.value.upgradeSelected, {count: selectedOutdated.value.length})}
              </Button>
            )
            : null}
        </Flex>
      )
    }
  },
})

export default PluginWorkspaceCheckList

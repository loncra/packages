import {computed, defineComponent, type PropType} from 'vue'
import {Badge, Button, Popover, SpaceCompact, Tooltip, Typography} from 'antdv-next'
import {ArrowUpOutlined, DeleteOutlined, DownloadOutlined, SettingOutlined} from '@antdv-next/icons'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import {
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  type PluginInstallGroup,
  type UserPluginInstallResult,
} from '@loncra/client/ai'
import type {WorkspaceMeta} from './usePluginInstallActions'
import {isPluginOutdated, isRecordUpgradeable} from './usePluginInstallActions'
import PluginWorkspaceCheckList from './PluginWorkspaceCheckList'
import type {AgentConversationRecord} from '../conversation'
import type {Self} from '../types'
import type {PluginCardRecord} from './types.ts'
import {fillLocale} from "@loncra/antdv";

const PluginCardAction = defineComponent({
  name: 'LAgentHubPluginCardAction',
  props: {
    record: {type: Object as PropType<PluginCardRecord>, required: true},
    group: {type: Object as PropType<PluginInstallGroup>, default: undefined},
    installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
    workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    self: {type: Object as PropType<Self>, default: undefined},
    targetType: {type: String, required: true},
  },
  emits: {
    install: (_scope?: number) => true,
    uninstall: (_selected: WorkspaceMeta[]) => true,
    upgrade: (_selected: WorkspaceMeta[]) => true,
  },
  setup(props, {emit}) {
    const locale = useLocale('AgentHub')
    const isOrgOwner = computed(() =>
      props.self?.type === AUTH_SERVER_AUTHENTICATION_TYPE.ENTERPRISE
      && (props.self?.authorities ?? []).includes('ROLE_ENTERPRISE_OWNER'),
    )

    function isUpgradePending(): boolean {
      return isRecordUpgradeable(props.record)
        && isPluginOutdated(props.installs, props.record, props.targetType)
    }

    function renderInstallButton() {
      return (
          <Tooltip title={locale.value.install}>
            <Button
              size="small"
              type="primary"
              onClick={() => emit('install', undefined)}
              v-slots={{icon: () => <DownloadOutlined />}}
            >
            </Button>
          </Tooltip>
      )
    }

    function renderUpgradeButton() {
      return (
          <Tooltip title={fillLocale(locale.value.upgrade, {version: props.record.latestVersion ?? ''})}>
            <Button
                size="small"
                type="primary"
                onClick={() => emit('upgrade', [])}
                v-slots={{icon: () => <ArrowUpOutlined />}}
            >
            </Button>
          </Tooltip>
      )
    }

    function renderUninstallButton() {
      const uninstall = (
          <Tooltip title={locale.value.uninstall}>
            <Button
              size="small"
              danger
              type="primary"
              onClick={() => emit('uninstall', [])}
              v-slots={{icon: () => <DeleteOutlined />}}
            >
            </Button>
          </Tooltip>
      )
      return (
        <Badge dot={isUpgradePending()}>
          <SpaceCompact block>
            {uninstall}
            {isUpgradePending() ? renderUpgradeButton() : null}
          </SpaceCompact>
        </Badge>
      )
    }

    function renderManageButton() {
      return (
          <Badge dot={isUpgradePending()}>
            <Button size="small" v-slots={{icon: () => <SettingOutlined />}}>
              {locale.value.manage}
            </Button>
          </Badge>
      )
    }

    return () => {
      if (props.group == null) {
        return renderInstallButton()
      }
      const group = props.group
      if (group.enterprise != null) {
        if (!isOrgOwner.value) {
          return <Typography.Text type="success">{locale.value.installed}</Typography.Text>
        }
        return renderUninstallButton()
      }
      if (group.userAll != null) {
        return renderUninstallButton()
      }
      return (
          <Popover
            trigger={['click']}
            placement="bottomRight"
            styles={{container:{maxWidth:'400px'}}}
            content={() => (
              <PluginWorkspaceCheckList
                installs={group.workspaces}
                conversationWorkspaces={props.workspaces}
                latestVersion={props.record.latestVersion}
                showAddButton={props.workspaces.length > group.workspaces.length}
                onUninstall={(selected) => emit('uninstall', selected)}
                onAddWorkspace={() => emit('install', AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED)}
                onUpgrade={(selected) => emit('upgrade', selected)}
              />
            )}
          >
            {renderManageButton()}
          </Popover>
      )
    }
  },
})

export default PluginCardAction

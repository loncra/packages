import {computed, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {fillLocale} from '@loncra/antdv'
import {
  AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  AgentHubService,
  type PluginInstallGroup,
  type UserPluginInstallResult,
  type UserPluginRequestBody,
  type UserPluginMetadata,
} from '@loncra/client/ai'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import type {Self} from '../types'
import type {PluginCardRecord} from './types.ts'
import {getEnumValue} from "@loncra/client";

export type WorkspaceMeta = NonNullable<UserPluginInstallResult['workspace']>

export function usePluginInstallActions(options: {
  targetType: string
  installs: Ref<UserPluginInstallResult[]>
  self: Ref<Self | undefined>
  onUninstalled: (event: UserPluginMetadata) => void
}) {
  const {targetType, installs, self, onUninstalled} = options
  const locale = useLocale('AgentHub')
  const {modal, message} = useApp()

  const installGroups = computed(() => {
      const groups = new Map<number, PluginInstallGroup>()
      for (const install of installs.value) {
        const packageId = install.pluginPackage?.id
        if (packageId == null || getEnumValue(install.targetType) !== targetType) {
          continue
        }
        const group = groups.get(packageId) ?? {workspaces: []}
        if (getEnumValue(install.scope) === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE) {
          group.enterprise = install
        } else if (install.workspace != null) {
          group.workspaces.push(install)
        } else {
          group.userAll = install
        }
        groups.set(packageId, group)
      }
      return groups
  })

  const isOrgOwner = computed(() =>
    self.value?.type === AUTH_SERVER_AUTHENTICATION_TYPE.ENTERPRISE
    && (self.value?.authorities ?? []).includes('ROLE_ENTERPRISE_OWNER'),
  )

  function uninstallBody(record: PluginCardRecord, group: PluginInstallGroup): UserPluginRequestBody {
    if (group.enterprise != null) {
      return {
        targetType,
        packageId: record.id!,
        scope: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE,
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      }
    }
    if (group.userAll != null) {
      return {targetType, packageId: record.id!, workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL}
    }
    return {
      targetType,
      packageId: record.id!,
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED,
      workspaces: group.workspaces.map(item => item.workspace!),
    }
  }

  async function doUninstall(record: PluginCardRecord, body: UserPluginRequestBody): Promise<void> {
    const result = await AgentHubService.uninstall(body)
    message.success(result.message)
    onUninstalled(body)
  }

  function onUninstall(record: PluginCardRecord): void {
    const group = record.id == null ? undefined : installGroups.value.get(record.id)
    if (group == null || record.id == null) {
      return
    }
    const count = group.workspaces.length
    const content = count > 1
      ? fillLocale(locale.value.uninstallAllConfirmSingle, {name: record.name, count})
      : fillLocale(locale.value.uninstallConfirmSingle, {name: record.name})
    modal.confirm({
      title: locale.value.uninstallConfirmTitle,
      content,
      onOk: () => doUninstall(record, uninstallBody(record, group)),
    })
  }

  async function onUninstallWorkspace(record: PluginCardRecord, workspace: WorkspaceMeta): Promise<void> {
    if (record.id == null) {
      return
    }
    await doUninstall(record, {
      targetType,
      packageId: record.id,
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED,
      workspaces: [workspace],
    })
  }

  return {
    installGroups,
    isOrgOwner,
    onUninstall,
    onUninstallWorkspace,
  }
}

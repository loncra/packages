import {computed, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {fillLocale} from '@loncra/antdv'
import {getEnumValue} from '@loncra/client/commons'
import {
  AgentHubService,
  AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type PluginInstallGroup,
  type UserPluginInstallResult,
  type UserPluginMetadata,
  type UserPluginRequestBody,
  type UserPluginSkillMetadata,
} from '@loncra/client/ai'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import type {Self} from '../types'
import type {PluginCardRecord} from './types.ts'

export type WorkspaceMeta = NonNullable<UserPluginInstallResult['workspace']>

export function groupInstallsByPackageId(
  installs: UserPluginInstallResult[],
  targetType: string,
): Map<number, PluginInstallGroup> {
  const groups = new Map<number, PluginInstallGroup>()
  for (const install of installs) {
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
}

export function isInstallOutdated(install: UserPluginInstallResult, record: {id?: number, latestVersion?: string}): boolean {
  const locked = (install.metadata as UserPluginSkillMetadata).releaseVersion
  return Boolean(locked) && locked !== record.latestVersion
}

export function isPluginOutdated(
  installs: UserPluginInstallResult[],
  record: {id?: number, latestVersion?: string},
  targetType: string,
): boolean {
  if (record.id == null || !record.latestVersion) {
    return false
  }
  return installs
    .filter(item => getEnumValue(item.targetType) === targetType && item.pluginPackage.id === record.id)
    .some(item => isInstallOutdated(item, record))
}

export function isRecordUpgradeable(record: PluginCardRecord): boolean {
  return record.defaultUpdatePolicy != null
    && getEnumValue(record.defaultUpdatePolicy) === AI_SERVER_SKILL_UPDATE_POLICY.MANUAL
}

export function usePluginInstallActions(options: {
  targetType: string
  installs: Ref<UserPluginInstallResult[]>
  self: Ref<Self | undefined>
  onInstalled: (result: UserPluginInstallResult) => void
  onUninstalled: (event: UserPluginMetadata) => void
}) {
  const {targetType, installs, self, onInstalled, onUninstalled} = options
  const locale = useLocale('AgentHub')
  const {modal, message} = useApp()

  const installGroups = computed(() =>
    groupInstallsByPackageId(installs.value, targetType),
  )

  const isOrgOwner = computed(() =>
    self.value?.type === AUTH_SERVER_AUTHENTICATION_TYPE.ENTERPRISE
    && (self.value?.authorities ?? []).includes('ROLE_ENTERPRISE_OWNER'),
  )

  function uninstallBody(
    record: PluginCardRecord,
    group: PluginInstallGroup,
    selected: WorkspaceMeta[],
  ): UserPluginRequestBody {
    if (group.enterprise != null) {
      return {
        targetType,
        packageId: record.id!,
        scope: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE,
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      }
    }
    if (group.userAll != null) {
      return {
        targetType,
        packageId: record.id!,
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
        scope: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER
      }
    }
    return {
      targetType,
      packageId: record.id!,
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED,
      workspaces: selected,
      scope: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER
    }
  }

  async function doUninstall(body: UserPluginRequestBody): Promise<void> {
    const result = await AgentHubService.uninstall(body)
    message.success(result.message)
    onUninstalled(body)
  }

  function onUninstall(record: PluginCardRecord, selected: WorkspaceMeta[]): void {
    const group = record.id == null ? undefined : installGroups.value.get(record.id)
    if (group == null || record.id == null) {
      return
    }
    const content = selected.length > 1
      ? fillLocale(locale.value.uninstallSelectedConfirm, {name: record.name, count: selected.length})
      : fillLocale(locale.value.uninstallConfirmSingle, {name: record.name})
    modal.confirm({
      title: locale.value.uninstallConfirmTitle,
      content,
      onOk: () => doUninstall(uninstallBody(record, group, selected)),
    })
  }

  function upgradeBody(
    record: PluginCardRecord,
    group: PluginInstallGroup,
    selected: WorkspaceMeta[],
  ): UserPluginRequestBody {
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
      workspaces: selected,
    }
  }

  async function doUpgrade(record: PluginCardRecord, body: UserPluginRequestBody): Promise<void> {
    const results = await AgentHubService.install(body)
    message.success(results.message)
    for (const item of results.data ?? []) {
      onInstalled(item)
    }
  }

  function onUpgrade(record: PluginCardRecord, selected: WorkspaceMeta[]): void {
    const group = record.id == null ? undefined : installGroups.value.get(record.id)
    if (group == null || record.id == null) {
      return
    }
    void doUpgrade(record, upgradeBody(record, group, selected))
  }

  return {
    installGroups,
    isOrgOwner,
    onUninstall,
    onUpgrade,
  }
}

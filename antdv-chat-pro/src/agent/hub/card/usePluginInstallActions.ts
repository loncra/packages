import {computed, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {fillLocale} from '@loncra/antdv'
import {getEnumValue} from '@loncra/client/commons'
import {
  AgentHubService,
  AI_SERVER_PLUGIN_INSTALL_STATUS,
  AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  AI_SERVER_SKILL_UPDATE_POLICY,
  type PluginInstallGroup,
  type UserPluginInstallResult,
  type UserPluginMetadata,
  type UserPluginRequestBody,
  type UserPluginSkillMetadata,
} from '@loncra/client/ai'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../../../_util/useLocale'
import type {Self} from '../../types'
import type {PluginCardRecord} from '../types'

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
    if (install.workspace != null) {
      // 带工作空间的安装行（USER+指定、ENTERPRISE+指定）一律按工作空间行归类
      group.workspaces.push(install)
    } else if (getEnumValue(install.scope) === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE) {
      // enterprise 槽位只收 ENTERPRISE+所有工作空间 的整体行
      group.enterprise = install
    } else {
      group.userAll = install
    }
    groups.set(packageId, group)
  }
  return groups
}

function isInstallOutdated(install: UserPluginInstallResult, record: {id?: number, latestVersion?: string}): boolean {
  const locked = (install.metadata as UserPluginSkillMetadata).releaseVersion
  return Boolean(locked) && locked !== record.latestVersion
}

function installRows(group: PluginInstallGroup | undefined): UserPluginInstallResult[] {
  return [
    group?.enterprise,
    group?.userAll,
    ...(group?.workspaces ?? []),
  ].filter((row): row is UserPluginInstallResult => row != null)
}

export function isUpgradePending(group: PluginInstallGroup | undefined, record: PluginCardRecord): boolean {
  return isRecordUpgradeable(record)
    && installRows(group).some((row) => isInstallOutdated(row, record))
}

export function hasInstallForScope(group: PluginInstallGroup | undefined, scope: number): boolean {
  if (group == null) {
    return false
  }
  return scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE
    ? group.enterprise != null
      || group.workspaces.some((row) => getEnumValue(row.scope) === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE)
    : group.userAll != null || group.workspaces.some((row) => getEnumValue(row.scope) === scope)
}

export function scopeGroup(group: PluginInstallGroup | undefined, scope: number): PluginInstallGroup | undefined {
  if (group == null) {
    return undefined
  }
  return {
    enterprise: scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE ? group.enterprise : undefined,
    userAll: scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER ? group.userAll : undefined,
    workspaces: group.workspaces.filter((row) => getEnumValue(row.scope) === scope),
  }
}

function isRecordUpgradeable(record: PluginCardRecord): boolean {
  return record.defaultUpdatePolicy != null
    && getEnumValue(record.defaultUpdatePolicy) === AI_SERVER_SKILL_UPDATE_POLICY.MANUAL
}

function severityOfInstallStatus(status: UserPluginInstallResult['status']): number {
  const value = getEnumValue(status)
  return value === 99 ? 2 : value === 30 ? 1 : 0
}

export function findPendingInstall(group: PluginInstallGroup | undefined): UserPluginInstallResult | undefined {
  return installRows(group)
    .sort((a, b) => severityOfInstallStatus(b.status) - severityOfInstallStatus(a.status))[0]
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

  const isOrgOwner = computed(() => AuthServerService.isEnterpriseOwner(self.value))

  function uninstallBody(
    record: PluginCardRecord,
    group: PluginInstallGroup,
    scope: number,
    selected: WorkspaceMeta[],
  ): UserPluginRequestBody {
    const row = scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE ? group.enterprise : group.userAll
    if (row != null) {
      return {
        targetType,
        packageId: record.id!,
        scope,
        workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
      }
    }
    return {
      targetType,
      packageId: record.id!,
      scope,
      workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED,
      workspaces: selected,
    }
  }

  async function doUninstall(body: UserPluginRequestBody): Promise<void> {
    const result = await AgentHubService.uninstall(body)
    message.success(result.message)
    onUninstalled(body)
  }

  function onUninstall(record: PluginCardRecord, scope: number, selected: WorkspaceMeta[]): void {
    const group = record.id == null ? undefined : installGroups.value.get(record.id)
    if (group == null || record.id == null) {
      return
    }
    if (scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE && !isOrgOwner.value) {
      return
    }
    const content = selected.length > 1
      ? fillLocale(locale.value.uninstallSelectedConfirm, {name: record.name, count: selected.length})
      : fillLocale(locale.value.uninstallConfirmSingle, {name: record.name})
    modal.confirm({
      title: locale.value.uninstallConfirmTitle,
      content,
      onOk: () => doUninstall(uninstallBody(record, group, scope, selected)),
    })
  }

  async function onStatusChange(row: UserPluginInstallResult, checked: boolean): Promise<UserPluginInstallResult | undefined> {
    if (row.pluginPackage?.id == null) {
      return undefined
    }
    const result = await AgentHubService.updateInstallStatus({
      targetType: getEnumValue(row.targetType),
      packageId: row.pluginPackage.id,
      scope: getEnumValue(row.scope) ?? AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER,
      status: checked ? AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED : AI_SERVER_PLUGIN_INSTALL_STATUS.DISABLED,
    })
    message.success(result.message)
    const updated = result.data
    if (updated != null) {
      onInstalled(updated)
    }
    return updated
  }

  return {
    installGroups,
    isOrgOwner,
    onUninstall,
    onStatusChange,
  }
}

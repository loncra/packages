import {reactive, ref, type Ref} from 'vue'
import {getEnumValue} from '@loncra/client/commons'
import type {UserPluginInstallResult} from '@loncra/client/ai'
import {
  AI_SERVER_EXECUTION_CHANNEL,
  AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
  AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
  type ExecutionChannel,
  type PluginInstallGroup,
  type UserPluginRequestBody,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from '../../conversation'
import type {PluginCardRecord, PluginInstallForm, WorkspaceScopeOption} from '../types'
import {hasInstallForScope, scopeGroup} from './usePluginInstallActions'

function workspaceScopeOf(
  row: UserPluginInstallResult | undefined,
  specified: UserPluginInstallResult[],
): WorkspaceScopeOption {
  if (row != null) {
    return getEnumValue(row.workspaceScope) === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
      ? AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
      : AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
  }
  return specified.length > 0
    ? AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
    : AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
}

export function usePluginInstallForm(options: {
  targetType: string
  workspaces: Ref<AgentConversationRecord[]>
}) {
  const {targetType, workspaces} = options
  const installOpen = ref(false)
  const installPackage = ref<PluginCardRecord>()
  const installGroup = ref<PluginInstallGroup>()
  const ownershipLocked = ref<number>()
  const installForm = reactive<PluginInstallForm>({
    workspaceScope: AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL,
    ownership: AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER,
    workspaces: [],
    workspaceVersions: {},
    metadata: {},
  })

  function resetForm(ownership: number): void {
    installForm.workspaceScope = AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ALL
    installForm.ownership = ownership
    installForm.workspaces = []
    installForm.workspaceVersions = {}
    installForm.metadata = {}
  }

  function prefillOwnershipForm(group: PluginInstallGroup, ownership: number): void {
    const scoped = scopeGroup(group, ownership)
    const row = scoped?.userAll ?? scoped?.enterprise
    const specified = scoped?.workspaces ?? []
    installForm.workspaceScope = workspaceScopeOf(row, specified)
    installForm.ownership = ownership
    installForm.workspaces = specified
      .filter((item) => item.workspace?.id != null)
      .map((item) => String(item.workspace!.id))
    installForm.workspaceVersions = {}
    const metadataRow = row ?? specified[0]
    installForm.metadata = {...(metadataRow?.metadata as Record<string, unknown> | undefined) ?? {}}
  }

  function onOwnershipChange(ownership: number): void {
    if (installGroup.value != null) {
      prefillOwnershipForm(installGroup.value, ownership)
      return
    }
    installForm.ownership = ownership
    installForm.workspaces = []
  }

  function onInstall(record: PluginCardRecord): void {
    if (record.id == null) {
      return
    }
    installPackage.value = record
    installGroup.value = undefined
    ownershipLocked.value = undefined
    resetForm(AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER)
    installOpen.value = true
  }

  function onInstallOwnership(record: PluginCardRecord, ownership: number): void {
    if (record.id == null) {
      return
    }
    installPackage.value = record
    installGroup.value = undefined
    ownershipLocked.value = ownership
    resetForm(ownership)
    installOpen.value = true
  }

  function onManage(record: PluginCardRecord, group?: PluginInstallGroup): void {
    if (record.id == null || group == null) {
      return
    }
    installPackage.value = record
    installGroup.value = group
    ownershipLocked.value = undefined
    prefillOwnershipForm(
      group,
      hasInstallForScope(group, AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER)
        ? AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.USER
        : AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE,
    )
    installOpen.value = true
  }

  function channelOfWorkspace(id: string): ExecutionChannel {
    const workspace = workspaces.value.find((item) => item.id === id)
    const kind = getEnumValue(workspace?.metadata?.kind)
    return kind === AI_SERVER_EXECUTION_CHANNEL.CLIENT
      ? AI_SERVER_EXECUTION_CHANNEL.CLIENT
      : AI_SERVER_EXECUTION_CHANNEL.CLOUD
  }

  function installBody(): UserPluginRequestBody {
    const body: UserPluginRequestBody = {
      targetType,
      packageId: installPackage.value!.id!,
      scope: installForm.ownership,
      workspaceScope: installForm.workspaceScope,
    }
    if (installForm.workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED) {
      body.workspaces = installForm.workspaces.map((id) => {
        const releaseVersion = installForm.workspaceVersions?.[id]
        return {
          id,
          value: channelOfWorkspace(id),
          metadata: releaseVersion == null ? undefined : {releaseVersion},
        }
      })
    }
    body.metadata = {...installForm.metadata}
    return body
  }

  return {
    installOpen,
    installPackage,
    installGroup,
    ownershipLocked,
    installForm,
    onInstall,
    onInstallOwnership,
    onOwnershipChange,
    onManage,
    installBody,
  }
}

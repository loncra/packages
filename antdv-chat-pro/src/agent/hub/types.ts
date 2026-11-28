import type {Component} from 'vue'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    type PluginPackageMetadata,
    type UserPluginInstallResult,
    type UserPluginMetadata,
    type UserPluginRequestBody,
} from '@loncra/client/ai'

export type WorkspaceScopeOption = (typeof AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE)[keyof typeof AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE]

export type PluginCardRecord = PluginPackageMetadata & {
  latestVersion?: string
  defaultUpdatePolicy?: NameValueEnumMetadata<number> | number
}

export interface PluginComponent {
  id: string
  label?: string
  icon: Component
  component: Component
}

export type PluginOverride = {id: string} & Partial<Omit<PluginComponent, 'id'>>

export interface PluginInstallForm extends Pick<UserPluginRequestBody, 'metadata'> {
  workspaceScope: WorkspaceScopeOption
  ownership: number
  workspaces: string[]
  workspaceVersions?: Record<string, string>
}

export interface AgentHubHandlers {
  onInstalled: (result: UserPluginInstallResult) => void
  onUninstalled: (event: UserPluginMetadata) => void
}

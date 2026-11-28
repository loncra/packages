import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE, type PluginPackageMetadata} from '@loncra/client/ai'
import type {Component} from "vue";

export type WorkspaceScopeOption = (typeof AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE)[keyof typeof AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE]

export type PluginCardRecord = PluginPackageMetadata & {
  latestVersion?: string
  defaultUpdatePolicy?: NameValueEnumMetadata<number> | number
}


export interface PluginComponent {
    id:string,
    label?:string,
    icon:Component,
    component:Component
}

export type PluginOverride = {id:string} & Partial<Omit<PluginComponent, 'id'>>
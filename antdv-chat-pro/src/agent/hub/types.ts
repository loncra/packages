import type {PluginPackageUpdatePolicyMetadata} from '@loncra/client/ai'
import type {Component} from "vue";

export type PluginCardRecord = PluginPackageUpdatePolicyMetadata


export interface PluginComponent {
    id:string,
    label?:string,
    icon:Component,
    component:Component
}

export type PluginOverride = {id:string} & Partial<Omit<PluginComponent, 'id'>>
import type {Component} from 'vue'
import {ApiOutlined, AppstoreOutlined, StarOutlined} from '@antdv-next/icons'
import {AI_SERVER_PLUGIN_TARGET_TYPE} from '@loncra/client/ai'

type PluginTargetType = (typeof AI_SERVER_PLUGIN_TARGET_TYPE)[keyof typeof AI_SERVER_PLUGIN_TARGET_TYPE]

export const PLUGIN_TYPE_ICONS = {
    [AI_SERVER_PLUGIN_TARGET_TYPE.MCP]: ApiOutlined,
    [AI_SERVER_PLUGIN_TARGET_TYPE.SKILL]: StarOutlined,
} satisfies Record<PluginTargetType, Component>

export const PLUGIN_TYPE_FALLBACK_ICON = AppstoreOutlined

export function pluginTypeIcon(targetType: string): Component {
    return PLUGIN_TYPE_ICONS[targetType as PluginTargetType] ?? PLUGIN_TYPE_FALLBACK_ICON
}

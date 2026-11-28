import type {Component} from 'vue'
import type {BadgeProps} from 'antdv-next'
import {ApiOutlined, AppstoreOutlined, StarOutlined} from '@antdv-next/icons'
import {AI_SERVER_PLUGIN_TARGET_TYPE} from '@loncra/client/ai'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'

type PluginTargetType = (typeof AI_SERVER_PLUGIN_TARGET_TYPE)[keyof typeof AI_SERVER_PLUGIN_TARGET_TYPE]

export const PLUGIN_TYPE_ICONS = {
    [AI_SERVER_PLUGIN_TARGET_TYPE.MCP]: ApiOutlined,
    [AI_SERVER_PLUGIN_TARGET_TYPE.SKILL]: StarOutlined,
} satisfies Record<PluginTargetType, Component>

export const PLUGIN_TYPE_FALLBACK_ICON = AppstoreOutlined

export function pluginTypeIcon(targetType: string): Component {
    return PLUGIN_TYPE_ICONS[targetType as PluginTargetType] ?? PLUGIN_TYPE_FALLBACK_ICON
}

/**
 * 插件安装状态（`UserPluginInstallResult.status`）→ 状态点（`a-badge` 的 `status`）。
 *
 * 10.待激活 → processing；20.已激活 → success；30.已禁用 → default；99.异常 → error。
 */
const PLUGIN_INSTALL_STATUS_BADGE: Record<number, BadgeProps['status']> = {
    10: 'processing',
    20: 'success',
    30: 'default',
    99: 'error',
}

export function pluginInstallStatusBadge(
    status: NameValueEnumMetadata<number> | number | undefined,
): BadgeProps['status'] {
    const value = getEnumValue(status)
    return value == null ? 'default' : PLUGIN_INSTALL_STATUS_BADGE[value] ?? 'default'
}

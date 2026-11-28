import type {Component} from 'vue'
import type {BadgeProps} from 'antdv-next'
import {getEnumValue, type NameValueEnumMetadata} from '@loncra/client/commons'
import {PLUGIN_TYPE_FALLBACK_ICON, PLUGIN_TYPE_ICONS} from './constants'

type PluginTargetType = keyof typeof PLUGIN_TYPE_ICONS

export function pluginTypeIcon(targetType: string): Component {
    return PLUGIN_TYPE_ICONS[targetType as PluginTargetType] ?? PLUGIN_TYPE_FALLBACK_ICON
}

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

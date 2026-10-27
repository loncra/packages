import type {Component} from 'vue'
import {ApiOutlined, AppstoreOutlined, StarOutlined} from '@antdv-next/icons'
import {isEnumValue} from '@loncra/client/commons'
import {AI_SERVER_PLUGIN_TARGET_TYPE} from '@loncra/client/ai'

export const MCP_PLUGIN_ICON = ApiOutlined
export const SKILL_PLUGIN_ICON = StarOutlined
export const PACKAGE_PLUGIN_ICON = AppstoreOutlined

export function pluginTypeIcon(targetType: number): Component {
    if (isEnumValue(targetType, AI_SERVER_PLUGIN_TARGET_TYPE.MCP)) {
        return MCP_PLUGIN_ICON
    }
    if (isEnumValue(targetType, AI_SERVER_PLUGIN_TARGET_TYPE.SKILL)) {
        return SKILL_PLUGIN_ICON
    }
    return PACKAGE_PLUGIN_ICON
}

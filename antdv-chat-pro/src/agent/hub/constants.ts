import {ApiOutlined, AppstoreOutlined, StarOutlined} from '@antdv-next/icons'
import {AI_SERVER_PLUGIN_TARGET_TYPE} from '@loncra/client/ai'

export const PLUGIN_TYPE_ICONS = {
    [AI_SERVER_PLUGIN_TARGET_TYPE.MCP]: ApiOutlined,
    [AI_SERVER_PLUGIN_TARGET_TYPE.SKILL]: StarOutlined,
} as const

export const PLUGIN_TYPE_FALLBACK_ICON = AppstoreOutlined

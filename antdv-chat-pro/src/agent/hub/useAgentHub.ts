import {type Component, computed, h, onMounted, ref, type VNode} from 'vue'
import {
  AI_SERVER_PLUGIN_TARGET_TYPE,
  type IdValueMetadata,
  ResourceServerService,
  type RestResult,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client'
import type {UserPluginInstallResult} from '@loncra/client/ai'
import InstalledPlugins from './market/InstalledPlugins.tsx'
import {useLocale} from '../../_util/useLocale.ts'
import type {AgentConversationRecord} from '../conversation'
import type {Self} from '../types'
import type {AgentHubHandlers, PluginComponent, PluginOverride} from './types.ts'
import McpMarket from './market/McpMarket.tsx'
import SkillMarket from './market/SkillMarket.tsx'
import {PLUGIN_TYPE_FALLBACK_ICON, PLUGIN_TYPE_ICONS} from './constants.ts'

interface AgentHubOption {
  value: string
  label: string
  icon: VNode
  component?: Component
  props: () => Record<string, unknown>
}

const USER_INSTALLED_PLUGIN_NAME = 'installed'

const DEFAULT_PLUGINS: PluginComponent[] = [
  {
    id: AI_SERVER_PLUGIN_TARGET_TYPE.MCP,
    icon: PLUGIN_TYPE_ICONS[AI_SERVER_PLUGIN_TARGET_TYPE.MCP],
    component: McpMarket
  },
  {
    id: AI_SERVER_PLUGIN_TARGET_TYPE.SKILL,
    icon: PLUGIN_TYPE_ICONS[AI_SERVER_PLUGIN_TARGET_TYPE.SKILL],
    component: SkillMarket
  },
  {
    id: USER_INSTALLED_PLUGIN_NAME,
    icon: PLUGIN_TYPE_FALLBACK_ICON,
    component: InstalledPlugins
  }
]

function mergePlugins(base: PluginComponent[], overrides: PluginOverride[]): PluginComponent[] {
  const merged = base.map(item => {
    const override = overrides.find(o => o.id === item.id)
    return override ? {...item, ...override} : item
  })
  for (const override of overrides) {
    if (override.component == null || merged.some(item => item.id === override.id)) {
      continue
    }
    merged.push({
      id: override.id,
      label: override.label,
      icon: override.icon ?? PLUGIN_TYPE_FALLBACK_ICON,
      component: override.component
    })
  }
  return merged
}

export function useAgentHub(input: {
  overrides: PluginOverride[]
  installs: () => UserPluginInstallResult[]
  workspaces: () => AgentConversationRecord[]
  self: () => Self
  handlers: AgentHubHandlers
}) {
  const {overrides, installs, workspaces, self, handlers} = input
  const locale = useLocale('AgentHub')
  const section = ref<string>('')
  const install = ref<boolean>(false)
  const pluginTypes = ref<IdValueMetadata<string, string>[]>([])

  const options = ref<AgentHubOption[]>([])

  const marketPropsOf = (extra?: Record<string, unknown>) => (): Record<string, unknown> => ({
    installs: installs(),
    workspaces: workspaces(),
    self: self(),
    onInstalled: handlers.onInstalled,
    onUninstalled: handlers.onUninstalled,
    ...extra,
  })

  function buildOptions(enumData: IdValueMetadata<string, string>[]): AgentHubOption[] {
    const enumIds = new Set(enumData.map(item => String(item.id)))
    const plugins = mergePlugins(DEFAULT_PLUGINS, overrides)
    const labelOf = (item: PluginComponent) =>
      item.label ?? (item.id === USER_INSTALLED_PLUGIN_NAME ? locale.value.myPlugin : item.id)
    const entries: AgentHubOption[] = []
    for (const item of enumData) {
      const p = plugins.find(p => p.id === String(item.id))
      entries.push({
        value: String(item.id),
        label: item.value,
        icon: h(p?.icon || PLUGIN_TYPE_FALLBACK_ICON),
        component: p?.component,
        props: marketPropsOf(),
      })
    }
    for (const p of plugins) {
      if (enumIds.has(p.id)) {
        continue
      }
      entries.push({
        value: p.id,
        label: labelOf(p),
        icon: h(p.icon),
        component: p.component,
        props: marketPropsOf(p.id === USER_INSTALLED_PLUGIN_NAME ? {pluginTypes: pluginTypes.value} : undefined),
      })
    }
    return entries
  }

  onMounted(async () => {
    install.value = true
    try {
      const result: RestResult<IdValueMetadata<string, string>[]> = await ResourceServerService.getServiceEnumerate(
        SYSTEM_MODULE_NAME.AI_SERVER,
        SYSTEM_ENUM_TYPE.PLUGIN_TARGET_TYPE_ENUM,
      )
      const enumData = result.data || []
      pluginTypes.value = enumData
      options.value = buildOptions(enumData)
      section.value = options.value.at(0)?.value ?? ''
    } finally {
      install.value = false
    }
  })

  const active = computed(() => options.value.find(p => p.value === section.value))
  return {
    options,
    section,
    install,
    active,
  }
}

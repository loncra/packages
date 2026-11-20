import {type Component, computed, h, onMounted, ref, type VNode} from "vue";
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    type IdValueMetadata,
    ResourceServerService,
    type RestResult,
    SYSTEM_ENUM_TYPE,
    SYSTEM_MODULE_NAME
} from "@loncra/client";
import InstalledPlugins from "./InstalledPlugins.tsx";
import {useLocale} from "../../_util/useLocale.ts";
import type {PluginComponent, PluginOverride} from "./types.ts";
import McpMarket from "./McpMarket.tsx";
import SkillMarket from "./SkillMarket.tsx";
import {PLUGIN_TYPE_FALLBACK_ICON, PLUGIN_TYPE_ICONS} from "./constants.ts";

interface AgentHubOption {
    value: string;
    label: string;
    icon: VNode;
    component?: Component;
}

export const USER_INSTALLED_PLUGIN_NAME = 'installed'

export const DEFAULT_PLUGINS: PluginComponent[] = [
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

export function mergePlugins(base: PluginComponent[], overrides: PluginOverride[]): PluginComponent[] {
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

export function useAgentHub(overrides: PluginOverride[]) {
    const locale = useLocale('AgentHub')
    const section = ref<string>('')
    const install = ref<boolean>(false)

    const options = ref<AgentHubOption[]>([])

    onMounted(async () => {
        install.value = true
        try {
            const result: RestResult<IdValueMetadata<string, string>[]> = await ResourceServerService.getServiceEnumerate(
                SYSTEM_MODULE_NAME.AI_SERVER,
                SYSTEM_ENUM_TYPE.PLUGIN_TARGET_TYPE_ENUM,
            )
            const enumData = result.data || []
            const enumIds = new Set(enumData.map(item => String(item.id)))
            const plugins = mergePlugins(DEFAULT_PLUGINS, overrides)
            const labelOf = (item: PluginComponent) =>
                item.label ?? (item.id === USER_INSTALLED_PLUGIN_NAME ? locale.value.myPlugin : item.id)
            for (const item of enumData) {
                const p = plugins.find(p => p.id === String(item.id))
                options.value.push({
                    value: String(item.id),
                    label: item.value,
                    icon: h(p?.icon || PLUGIN_TYPE_FALLBACK_ICON),
                    component: p?.component
                })
            }
            for (const p of plugins) {
                if (enumIds.has(p.id)) {
                    continue
                }
                options.value.push({
                    value: p.id,
                    label: labelOf(p),
                    icon: h(p.icon),
                    component: p.component
                })
            }
            section.value = options.value.at(0)?.value ?? ''
        } finally {
            install.value = false
        }
    })

    const activeComponent = computed(() => options.value.find(p => p.value === section.value)?.component)
    return {
        options,
        section,
        install,
        activeComponent,
    }
}

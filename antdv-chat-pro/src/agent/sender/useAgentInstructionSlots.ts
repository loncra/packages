import {computed, h, type Ref} from 'vue'
import {Tag} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionItem, InstructionMeasure, InstructionSenderHandle} from '@loncra/antdv-chat'
import type {InstructionBlock} from '@loncra/chat-core'
import {getEnumValue, type IdValueMetadata} from '@loncra/client/commons'
import {
    AI_SERVER_PLUGIN_INSTALL_STATUS,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    AI_SERVER_PLUGIN_TARGET_TYPE,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import {MCP_PLUGIN_ICON, SKILL_PLUGIN_ICON} from '../pluginIcons'
import type {AgentSenderExpose} from './AgentSender'

export const TRIGGER = '/'
export const MCP_PREFIX = '/mcp'
export const SKILL_PREFIX = '/skill'

function instructionIcon(prefix: string): typeof MCP_PLUGIN_ICON | typeof SKILL_PLUGIN_ICON | undefined {
    if (prefix === MCP_PREFIX) {
        return MCP_PLUGIN_ICON
    }
    if (prefix === SKILL_PREFIX) {
        return SKILL_PLUGIN_ICON
    }
    return undefined
}

function matchesWorkspaceScope(item: UserPluginInstallResult, workspaceId: number | undefined): boolean {
    const scope = getEnumValue(item.workspaceScope)
    if (scope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG) {
        return true
    }
    if (workspaceId == null) {
        return false
    }
    return item.workspaces?.some((workspace) => String(workspace.id) === String(workspaceId)) ?? false
}

export function toCatalogItems(
    installs: UserPluginInstallResult[],
    workspaceId: number | undefined,
    groupLabels: {mcp: string; skill: string},
): InstructionItem[] {
    const items: InstructionItem[] = []
    for (const item of installs) {
        if (getEnumValue(item.status) !== AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED) {
            continue
        }
        if (!item.pluginPackage || item.packageId == null) {
            continue
        }
        if (!matchesWorkspaceScope(item, workspaceId)) {
            continue
        }
        const targetType = getEnumValue(item.targetType)
        const isMcp = targetType === AI_SERVER_PLUGIN_TARGET_TYPE.MCP
        const isSkill = targetType === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL
        if (!isMcp && !isSkill) {
            continue
        }
        items.push({
            id: String(item.packageId),
            value: item.pluginPackage.name,
            metadata: {
                trigger: TRIGGER,
                group: isMcp ? 'mcp' : 'skill',
                groupLabel: isMcp ? groupLabels.mcp : groupLabels.skill,
                slotPrefix: isMcp ? MCP_PREFIX : SKILL_PREFIX,
                icon: item.pluginPackage.icon,
            },
        })
    }
    return items
}

export function useAgentInstructionSlots(options: {
    senderRef: Ref<AgentSenderExpose | undefined>
    catalogItems: Ref<InstructionItem[]>
}) {
    const {senderRef, catalogItems} = options

    function instructionSlot(block: InstructionBlock): SlotConfigType {
        return {
            type: 'custom',
            key: block.id,
            props: {slotKind: 'instruction', defaultValue: block.value, prefix: block.prefix},
            customRender: (value: IdValueMetadata<string, string>, _onChange, _slotProps, item) => {
                const slotKey = 'key' in item && item.key ? item.key : ''
                const prefix = item.type === 'custom'
                    ? String((item.props as {prefix?: string} | undefined)?.prefix ?? '')
                    : ''
                const icon = instructionIcon(prefix)
                return h(Tag, {key: slotKey, variant: 'outlined'}, {
                    icon: icon ? () => h(icon) : undefined,
                    default: () => value.value,
                })
            },
        }
    }

    function findCatalogItem(key: string | number): InstructionItem | undefined {
        const raw = String(key)
        const separator = raw.indexOf(':')
        if (separator < 0) {
            return undefined
        }
        const group = raw.slice(0, separator)
        const id = raw.slice(separator + 1)
        return catalogItems.value.find((item) => item.metadata?.group === group && item.id === id)
    }

    function insertCatalogItem(option: InstructionItem, measure?: InstructionMeasure): void {
        const sender = senderRef.value?.getSender()
        if (!sender) {
            return
        }
        const slotPrefix = String(option.metadata?.slotPrefix ?? measure?.prefix ?? '')
        if (!slotPrefix) {
            return
        }
        const block = instructionSlot({
            id: crypto.randomUUID(),
            type: 'custom',
            slotKind: 'instruction',
            value: {id: String(option.id ?? ''), value: option.value},
            prefix: slotPrefix,
        })
        if (measure) {
            sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
            return
        }
        sender.insert([block, {type: 'text', value: ' '}], 'cursor')
    }

    function createInstructionSlot(option: InstructionItem, measure: InstructionMeasure): object {
        return instructionSlot({
            id: crypto.randomUUID(),
            type: 'custom',
            slotKind: 'instruction',
            value: option as unknown as IdValueMetadata<string, string>,
            prefix: String(option.metadata?.slotPrefix ?? measure.prefix),
        })
    }

    function senderInsertInstruction(
        sender: InstructionSenderHandle,
        block: object,
        measure: InstructionMeasure,
    ): void {
        sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
    }

    const instructionMap = computed(() => ({
        [TRIGGER]: catalogItems.value.filter((item) => item.metadata?.trigger === TRIGGER),
    }))

    return {
        instructionSlot,
        findCatalogItem,
        insertCatalogItem,
        createInstructionSlot,
        senderInsertInstruction,
        instructionMap,
    }
}

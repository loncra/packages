import {computed, h, type Ref} from 'vue'
import {Tag} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionItem, InstructionMeasure, InstructionSenderHandle} from '@loncra/antdv-chat'
import type {InstructionBlock} from '@loncra/chat-core'
import {getEnumName, getEnumValue, type IdValueMetadata} from '@loncra/client/commons'
import {
    AI_SERVER_PLUGIN_INSTALL_LAYER,
    AI_SERVER_PLUGIN_INSTALL_STATUS,
    AI_SERVER_PLUGIN_INSTALL_USER_SCOPE,
    AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import {pluginTypeIcon} from '../hub/hubKinds'
import type {AgentConversationRecord} from '../conversation'
import type {AgentSenderExpose} from './types.ts'

export const TRIGGER = '/'

function matchesWorkspace(item: UserPluginInstallResult, workspaceId: string | undefined): boolean {
    return workspaceId != null && String(item.workspace?.id ?? '') === workspaceId
}

function appliesToWorkspace(
    item: UserPluginInstallResult,
    workspaceId: string | undefined,
    workspaceEnterprise: boolean,
): boolean {
    const scope = getEnumValue(item.scope)
    const workspaceScope = getEnumValue(item.workspaceScope)
    if (scope === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE) {
        if (!workspaceEnterprise) {
            return false
        }
        return workspaceScope !== AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED
            || matchesWorkspace(item, workspaceId)
    }
    if (workspaceScope === AI_SERVER_PLUGIN_INSTALL_WORKSPACE_SCOPE.SPECIFIED) {
        return matchesWorkspace(item, workspaceId)
    }
    return true
}

function layerOrder(item: UserPluginInstallResult): number {
    return getEnumValue(item.layer) ?? AI_SERVER_PLUGIN_INSTALL_LAYER.USER_ROW
}

function toCatalogItem(item: UserPluginInstallResult): InstructionItem {
    const targetType = getEnumValue(item.targetType)
    const usable = getEnumValue(item.status) === AI_SERVER_PLUGIN_INSTALL_STATUS.ACTIVATED
    return {
        id: String(targetType + ':' + item.pluginPackage.id),
        value: item.pluginPackage.name,
        metadata: {
            trigger: TRIGGER,
            group: targetType,
            groupLabel: getEnumName(item.targetType),
            slotPrefix: targetType,
            icon: item.pluginPackage.icon,
            packageId: item.pluginPackage.id,
            scope: getEnumValue(item.scope),
            disabled: usable ? undefined : {
                statusName: getEnumName(item.status) ?? '',
                exception: item.exception,
            },
        },
    }
}

function pickActive(
    list: {item: UserPluginInstallResult; order: number}[],
): {item: UserPluginInstallResult; order: number} | undefined {
    let active = list[0]
    for (const candidate of list) {
        if (getEnumValue(candidate.item.status) !== AI_SERVER_PLUGIN_INSTALL_STATUS.DISABLED) {
            active = candidate
            break
        }
    }
    return active
}

function groupInstalls(
    installs: UserPluginInstallResult[],
    workspaceId: string | undefined,
    workspaceEnterprise: boolean,
): Map<string, {item: UserPluginInstallResult; order: number}[]> {
    const grouped = new Map<string, {item: UserPluginInstallResult; order: number}[]>()
    for (const item of installs) {
        if (!item.pluginPackage || !appliesToWorkspace(item, workspaceId, workspaceEnterprise)) {
            continue
        }
        const targetType = getEnumValue(item.targetType)
        const id = String(targetType + ':' + item.pluginPackage.id)
        const list = grouped.get(id) ?? []
        list.push({item, order: layerOrder(item)})
        grouped.set(id, list)
    }
    return grouped
}

export function toCatalogItems(
    installs: UserPluginInstallResult[],
    workspace: AgentConversationRecord | undefined
): InstructionItem[] {
    const workspaceId = workspace?.id == null ? undefined : String(workspace.id)
    const workspaceEnterprise = getEnumValue(workspace?.ownership) === AI_SERVER_PLUGIN_INSTALL_USER_SCOPE.ENTERPRISE

    const items: InstructionItem[] = []
    for (const list of groupInstalls(installs, workspaceId, workspaceEnterprise).values()) {
        list.sort((a, b) => a.order - b.order)
        const active = pickActive(list)
        if (active) {
            items.push(toCatalogItem(active.item))
        }
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
                const icon = pluginTypeIcon(prefix.replace('/', ''))
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

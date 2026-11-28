import {type Component, h} from 'vue'
import {Button, Flex, type MenuItemType, Space} from 'antdv-next'
import {ApiOutlined, StarOutlined} from '@antdv-next/icons'
import {ICON_SELECT_AVATAR_MODE_VALUE, type IconFontRenderFn, IconSelect} from '@loncra/antdv'
import type {InstructionItem} from '@loncra/antdv-chat'
import type {ModelSettingEntity} from '@loncra/client/ai'

export interface CatalogMenuOptions {
    onActivate?: (key: string) => void
    activateText?: string
}

interface CatalogDisabledMetadata {
    disabled?: {statusName?: string; exception?: string}
}

function disabledLabel(item: InstructionItem, key: string, options: CatalogMenuOptions | undefined) {
    const disabled = (item.metadata as CatalogDisabledMetadata | undefined)?.disabled
    return (
        <Flex justify="space-between" align="center" gap="small" style="opacity: .45">
            <span>{item.value}{disabled?.statusName ? `（${disabled.statusName}）` : ''}</span>
            {options?.onActivate
                ? (
                    <Button
                        size="small"
                        type="text"
                        onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            options.onActivate!(key)
                        }}
                    >
                        {options.activateText}
                    </Button>
                )
                : null}
        </Flex>
    )
}

type CatalogGroup = {label: string; icon: Component; children: MenuItemType[]}

function upsertCatalogGroup(groups: Map<string, CatalogGroup>, item: InstructionItem): CatalogGroup | undefined {
    const group = String(item.metadata?.group ?? '')
    if (!group) {
        return undefined
    }
    let bucket = groups.get(group)
    if (!bucket) {
        bucket = {
            label: String(item.metadata?.groupLabel ?? group),
            icon: group === 'mcp' ? ApiOutlined : StarOutlined,
            children: [],
        }
        groups.set(group, bucket)
    }
    return bucket
}

export function toCatalogMenuItems(items: InstructionItem[], options?: CatalogMenuOptions): MenuItemType[] {
    const groups = new Map<string, CatalogGroup>()
    for (const item of items) {
        const bucket = upsertCatalogGroup(groups, item)
        if (!bucket) {
            continue
        }
        const key = String(item.metadata?.group) + ':' + item.id
        const isDisabled = Boolean((item.metadata as CatalogDisabledMetadata | undefined)?.disabled)
        bucket.children.push({
            key,
            label: isDisabled ? disabledLabel(item, key, options) : item.value,
            icon: () => (
                <IconSelect
                    preview
                    size={"small"}
                    value={String(item.metadata?.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + item.value)}
                />
            ),
        })
    }
    return Array.from(groups.entries()).map(([key, group]) => ({
        type: 'group' as const,
        key,
        label: h(Space, {}, () => [h(group.icon), h('span', {}, group.label)]),
        children: group.children,
    }))
}

export function toModelMenuItems(rows: ModelSettingEntity[], iconFontRender: IconFontRenderFn): MenuItemType[] {
    const groups = new Map<string, {label: string; icon?: string; children: MenuItemType[]}>()
    for (const item of rows) {
        const group = upsertModelGroup(groups, item)
        const icon = item.icon
        group.children.push({
            key: String(item.id),
            label: item.name,
            icon: icon ? () => iconFontRender(icon) : () => h(ApiOutlined),
        })
    }
    return Array.from(groups.entries()).map(([code, group]) => ({
        type: 'group' as const,
        key: code,
        label: h(Space, {}, () => [group.icon ? iconFontRender(group.icon) : null, h('span', {}, group.label)]),
        children: group.children,
    }))
}

function upsertModelGroup(
    groups: Map<string, {label: string; icon?: string; children: MenuItemType[]}>,
    item: ModelSettingEntity,
) {
    const code = item.manufacturer?.code || 'unknown'
    let group = groups.get(code)
    if (!group) {
        const icon = item.manufacturer?.metadata?.icon
        group = {label: item.manufacturer?.name || '', icon: typeof icon === 'string' ? icon : undefined, children: []}
        groups.set(code, group)
    }
    return group
}

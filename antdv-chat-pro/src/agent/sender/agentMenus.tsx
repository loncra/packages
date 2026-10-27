import {h, type Component} from 'vue'
import {Space, type MenuItemType} from 'antdv-next'
import {ApiOutlined, StarOutlined} from '@antdv-next/icons'
import {IconSelect, ICON_SELECT_AVATAR_MODE_VALUE, iconFontNode} from '@loncra/antdv'
import type {InstructionItem} from '@loncra/antdv-chat'
import type {ModelSettingEntity} from '@loncra/client/ai'

export function toCatalogMenuItems(items: InstructionItem[]): MenuItemType[] {
    const groups = new Map<string, {label: string; icon: Component; children: MenuItemType[]}>()
    for (const item of items) {
        const group = String(item.metadata?.group ?? '')
        if (!group) {
            continue
        }
        let bucket = groups.get(group)
        if (!bucket) {
            const bucketValue: {label: string; icon: Component; children: MenuItemType[]} = {
                label: String(item.metadata?.groupLabel ?? group),
                icon: group === 'mcp' ? ApiOutlined : StarOutlined,
                children: [],
            }
            groups.set(group, bucketValue)
            bucket = bucketValue
        }
        bucket.children.push({
            key: group + ':' + item.id,
            label: item.value,
            icon: () => (
                <IconSelect
                    preview
                    size={"small"}
                    value={String(item.metadata?.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + item.value)}
                    iconRender={(type: string) => (type ? iconFontNode(type) : null)}
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

export function toModelMenuItems(rows: ModelSettingEntity[]): MenuItemType[] {
    const groups = new Map<string, {label: string; icon?: string; children: MenuItemType[]}>()
    for (const item of rows) {
        const group = upsertModelGroup(groups, item)
        const icon = item.icon
        group.children.push({
            key: String(item.id),
            label: item.name,
            icon: icon ? () => iconFontNode(icon) : () => h(ApiOutlined),
        })
    }
    return Array.from(groups.entries()).map(([code, group]) => ({
        type: 'group' as const,
        key: code,
        label: h(Space, {}, () => [iconFontNode(group.icon), h('span', {}, group.label)]),
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

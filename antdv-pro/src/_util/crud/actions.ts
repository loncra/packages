import {type ComputedRef, type InjectionKey, ref, type VNode} from 'vue'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {ActionAuth} from '../../crud-config-provider/types'

export type ActionScope = 'toolbar' | 'item'

export interface ActionContext<TItem = unknown> {
  scope: ActionScope
  record?: TItem
  items: TItem[]
  selectedItems: TItem[]
  query?: FilterRequest | PageRequest
  extras: Record<string, unknown>
}

export interface ActionDefinition<TItem = unknown> {
  id: string
  permission?: string | boolean
  danger?: boolean
  visible?: (ctx: ActionContext<TItem>) => boolean
  enabled?: (ctx: ActionContext<TItem>) => boolean
  label?: (ctx: ActionContext<TItem>) => string
  icon?: (ctx: ActionContext<TItem>) => VNode | null
  run?: (ctx: ActionContext<TItem>) => void | Promise<void>
}

export interface ResolvedAction {
  id: string
  label: string
  icon?: VNode | null
  danger?: boolean
  disabled: boolean
  loading?: boolean
  run?: () => void | Promise<void>
}

export interface ActionPayload<TItem = unknown> {
  id: string
  context: ActionContext<TItem>
}

export const ACTION_CONTEXT_KEY: InjectionKey<ComputedRef<ActionContext>> =
  Symbol('loncraActionContext')

export const BUILTIN_ITEM_ACTION_IDS = ['edit', 'detail', 'delete'] as const
export const BUILTIN_BULK_ACTION_IDS = ['deleteSelected'] as const

export function mergeDefinitions<TItem>(
  ...lists: Array<ActionDefinition<TItem>[] | undefined>
): ActionDefinition<TItem>[] {
  const map = new Map<string, ActionDefinition<TItem>>()
  for (const def of lists.flatMap((list) => list ?? [])) {
    const existing = map.get(def.id)
    map.set(def.id, existing ? {...existing, ...def} : def)
  }
  return [...map.values()]
}

export function overrideAction<TItem>(
  definitions: ActionDefinition<TItem>[],
  id: string,
  patch: Partial<ActionDefinition<TItem>>,
): ActionDefinition<TItem>[] {
  return definitions.map((def) => (def.id === id ? {...def, ...patch} : def))
}

export interface ActionResolver {
  resolveActions: <TItem>(
    definitions: ActionDefinition<TItem>[],
    context: ActionContext<TItem>,
    auth: ActionAuth,
  ) => ResolvedAction[]
}

/**
 * 建一个带运行态的 action 解析器。
 *
 * loading 必须存在组件实例自己的 ref 里：写成模块级单例会让页面上所有表格
 * 共享同一份运行态，A 表格点了删除，B 表格的删除按钮也会转圈。
 * 每个组件在 setup 里调一次，把返回的 resolveActions 用于该实例的全部动作。
 */
export function useActionResolver(): ActionResolver {
  const runningIds = ref(new Set<string>())

  function resolveActions<TItem>(
    definitions: ActionDefinition<TItem>[],
    context: ActionContext<TItem>,
    auth: ActionAuth,
  ): ResolvedAction[] {
    return definitions
      .filter((def) => auth.can(def.permission))
      .filter((def) => def.visible?.(context) ?? true)
      .map((def) => {
        const loading = runningIds.value.has(def.id)
        const disabled = loading || !(def.enabled?.(context) ?? true)
        return {
          id: def.id,
          label: def.label?.(context) ?? '',
          icon: def.icon?.(context),
          danger: def.danger,
          disabled,
          loading,
          run: disabled
            ? undefined
            : async () => {
                const result = def.run?.(context)
                if (!(result instanceof Promise)) {
                  return
                }
                runningIds.value = new Set(runningIds.value).add(def.id)
                try {
                  await result
                } finally {
                  const next = new Set(runningIds.value)
                  next.delete(def.id)
                  runningIds.value = next
                }
              },
        }
      })
  }

  return {resolveActions}
}

export function buildItemActionContext<TItem>(options: {
  record: TItem
  toolbarContext?: ActionContext<TItem>
  actionContextExtras?: Record<string, unknown>
}): ActionContext<TItem> {
  const {record, toolbarContext, actionContextExtras} = options
  return {
    scope: 'item',
    record,
    items: toolbarContext?.items ?? [],
    selectedItems: toolbarContext?.selectedItems ?? [],
    query: toolbarContext?.query,
    extras: {...toolbarContext?.extras, ...actionContextExtras},
  }
}

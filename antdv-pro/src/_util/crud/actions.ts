import {type ComputedRef, type InjectionKey, ref, type VNode} from 'vue'
import type {useAppProps} from 'antdv-next/dist/app/context'
import {type BasicIdMetadata, type FilterRequest, type PageRequest, SYSTEM_CONSTANT,} from '@loncra/client/commons'
import type {ActionAuth} from '../../crud-config-provider/types'

export type ActionScope = 'toolbar' | 'item'

/**
 * 应用内实例（提示 / 确认框）。**由壳在 setup 里 `App.useApp()` 拿到后注入**，
 * 不这么走就只能 `import {message, Modal} from 'antdv-next'` 用静态实例 —— 静态实例吃不到
 * `<a-app>` / ConfigProvider 的主题与语言配置。声明文件不在 setup 里，所以只能由壳传。
 */
export interface ActionAppApis {
  message: useAppProps['message']
  modal: useAppProps['modal']
}

export interface ActionContext<TItem extends BasicIdMetadata<unknown> = BasicIdMetadata<unknown>> {
  scope: ActionScope
  record?: TItem
  items: TItem[]
  selectedItems: TItem[]
  query?: FilterRequest | PageRequest
  extras: Record<string, unknown>
  /** 提示：来自壳的 `App.useApp()`（别用静态 message） */
  message: ActionAppApis['message']
  /** 确认框：同上（别用静态 Modal） */
  modal: ActionAppApis['modal']
}

export interface ActionDefinition<TItem extends BasicIdMetadata<unknown> = BasicIdMetadata<unknown>> {
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

export interface ActionPayload<TItem extends BasicIdMetadata<unknown> = BasicIdMetadata<unknown>> {
  id: string
  context: ActionContext<TItem>
}

export const ACTION_CONTEXT_KEY: InjectionKey<ComputedRef<ActionContext>> =
  Symbol('loncraActionContext')

export const BUILTIN_ACTION_ID = {
  EDIT: 'edit',
  DETAIL: 'detail',
  DELETE: 'delete',
  DELETE_SELECTED: 'deleteSelected',
} as const

export const BUILTIN_ITEM_ACTION_IDS = [
  BUILTIN_ACTION_ID.EDIT,
  BUILTIN_ACTION_ID.DETAIL,
  BUILTIN_ACTION_ID.DELETE,
] as const
export const BUILTIN_BULK_ACTION_IDS = [BUILTIN_ACTION_ID.DELETE_SELECTED] as const

export function mergeDefinitions<TItem extends BasicIdMetadata<unknown>>(
  ...lists: Array<ActionDefinition<TItem>[] | undefined>
): ActionDefinition<TItem>[] {
  const map = new Map<string, ActionDefinition<TItem>>()
  for (const def of lists.flatMap((list) => list ?? [])) {
    const existing = map.get(def.id)
    map.set(def.id, existing ? {...existing, ...def} : def)
  }
  return [...map.values()]
}

export function overrideAction<TItem extends BasicIdMetadata<unknown>>(
  definitions: ActionDefinition<TItem>[],
  id: string,
  patch: Partial<ActionDefinition<TItem>>,
): ActionDefinition<TItem>[] {
  return definitions.map((def) => (def.id === id ? {...def, ...patch} : def))
}

export interface ActionResolver {
  resolveActions: <TItem extends BasicIdMetadata<unknown>>(
    definitions: ActionDefinition<TItem>[],
    context: ActionContext<TItem>,
    auth: ActionAuth,
  ) => ResolvedAction[]
}

/**
 * 运行态的键。同一个组件实例里，工具栏动作与每一行的行内动作共用一个解析器，
 * 因此只按 action id 记运行态会让第 1 行的异步动作把所有行的同名按钮一起置灰。
 * 行级动作按记录 id 分桶，工具栏/批量动作共用一个桶。
 */
function runKey<TItem extends BasicIdMetadata<unknown>>(
  def: ActionDefinition<TItem>,
  context: ActionContext<TItem>,
): string {
  if (context.scope !== 'item' || context.record == null) {
    return `toolbar:${def.id}`
  }
  return `item:${String(context.record[SYSTEM_CONSTANT.ID_NAME])}:${def.id}`
}

/**
 * 建一个带运行态的 action 解析器。
 *
 * loading 必须存在组件实例自己的 ref 里：写成模块级单例会让页面上所有表格
 * 共享同一份运行态，A 表格点了删除，B 表格的删除按钮也会转圈。
 * 每个组件在 setup 里调一次，把返回的 resolveActions 用于该实例的全部动作。
 */
export function useActionResolver(): ActionResolver {
  // 用计数而非 Set：按钮变 disabled 要等下一次渲染，快速双击可能命中同一份
  // 已解析的 run 闭包，两次运行共用一个键，先完成的那次不能把运行态清掉。
  const running = ref(new Map<string, number>())

  function retain(key: string) {
    const next = new Map(running.value)
    next.set(key, (next.get(key) ?? 0) + 1)
    running.value = next
  }

  function release(key: string) {
    const next = new Map(running.value)
    const count = (next.get(key) ?? 1) - 1
    if (count > 0) {
      next.set(key, count)
    } else {
      next.delete(key)
    }
    running.value = next
  }

  function resolveActions<TItem extends BasicIdMetadata<unknown>>(
    definitions: ActionDefinition<TItem>[],
    context: ActionContext<TItem>,
    auth: ActionAuth,
  ): ResolvedAction[] {
    return definitions
      .filter((def) => auth.can(def.permission))
      .filter((def) => def.visible?.(context) ?? true)
      .map((def) => {
        const key = runKey(def, context)
        const loading = running.value.has(key)
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
                retain(key)
                try {
                  await result
                } finally {
                  release(key)
                }
              },
        }
      })
  }

  return {resolveActions}
}

export function buildItemActionContext<TItem extends BasicIdMetadata<unknown>>(options: {
  record: TItem
  toolbarContext?: ActionContext<TItem>
  actionContextExtras?: Record<string, unknown>
  /** 壳自己的 `App.useApp()`（工具条上下文还没就绪时也得有提示/确认框） */
  app: ActionAppApis
}): ActionContext<TItem> {
  const {record, toolbarContext, actionContextExtras, app} = options
  return {
    scope: 'item',
    record,
    items: toolbarContext?.items ?? [],
    selectedItems: toolbarContext?.selectedItems ?? [],
    query: toolbarContext?.query,
    extras: {...toolbarContext?.extras, ...actionContextExtras},
    message: app.message,
    modal: app.modal,
  }
}

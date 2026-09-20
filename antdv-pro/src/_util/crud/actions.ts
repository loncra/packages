import {ref, type VNode} from 'vue'
import type {useAppProps} from 'antdv-next/dist/app/context'
import {type BasicIdMetadata, type FilterRequest, type PageRequest, SYSTEM_CONSTANT,} from '@loncra/client/commons'
import type {ActionAuth} from '../../crud-config-provider/types'

/**
 * 应用内实例（提示 / 确认框）。**由壳在 setup 里 `App.useApp()` 拿到后注入**，
 * 不这么走就只能 `import {message, Modal} from 'antdv-next'` 用静态实例 —— 静态实例吃不到
 * `<a-app>` / ConfigProvider 的主题与语言配置。声明文件不在 setup 里，所以只能由壳传。
 */
export interface ActionAppApis {
  message: useAppProps['message']
  modal: useAppProps['modal']
}

/** 两种动作都有的：壳注入的提示 / 确认框 */
export interface ActionContext {
  /** 提示：来自壳的 `App.useApp()`（别用静态 message） */
  message: ActionAppApis['message']
  /** 确认框：同上（别用静态 Modal） */
  modal: ActionAppApis['modal']
}

/** 工具栏 / 批量动作能看到的：整批数据、选中集合、当前查询 */
export interface ToolbarActionContext<TItem extends BasicIdMetadata<unknown>> extends ActionContext {
  items: TItem[]
  selectedItems: TItem[]
  query?: FilterRequest | PageRequest
}

/** 行内 / 项内动作能看到的：只有当前记录（要整批数据 / 选中集合就用工具栏动作） */
export interface RecordActionContext<TItem extends BasicIdMetadata<unknown>> extends ActionContext {
  record?: TItem
}

/** 两种动作定义的共同字段；`C` 是它们各自能看到的上下文（工具栏 / 行内不共用同一个） */
export interface ActionDefinitionBase<TItem extends BasicIdMetadata<unknown>, C extends ActionContext> {
  id: string
  permission?: string | boolean
  danger?: boolean
  visible?: (ctx: C) => boolean
  enabled?: (ctx: C) => boolean
  label?: (ctx: C) => string
  icon?: (ctx: C) => VNode | null
  run?: (ctx: C) => void | Promise<void>
}

/** 工具栏 / 批量动作的定义（参数是 `ToolbarActionContext`） */
export type ToolbarActionDefinition<TItem extends BasicIdMetadata<unknown>> = ActionDefinitionBase<
  TItem,
  ToolbarActionContext<TItem>
>

/** 行内 / 项内动作的定义（参数是 `RecordActionContext`） */
export type RecordActionDefinition<TItem extends BasicIdMetadata<unknown>> = ActionDefinitionBase<
  TItem,
  RecordActionContext<TItem>
>

export interface ResolvedAction {
  id: string
  label: string
  icon?: VNode | null
  danger?: boolean
  disabled: boolean
  loading?: boolean
  run?: () => void | Promise<void>
}

/** `action` 事件：工具栏动作带 `ToolbarActionPayload`，行内动作带 `RecordActionPayload` */
export interface ToolbarActionPayload<TItem extends BasicIdMetadata<unknown>> {
  id: string
  context: ToolbarActionContext<TItem>
}
export interface RecordActionPayload<TItem extends BasicIdMetadata<unknown>> {
  id: string
  context: RecordActionContext<TItem>
}

export const BUILTIN_ACTION_ID = {
  EDIT: 'edit',
  DETAIL: 'detail',
  DELETE: 'delete',
  DELETE_SELECTED: 'deleteSelected',
} as const

export const BUILTIN_RECORD_ACTION_IDS = [
  BUILTIN_ACTION_ID.EDIT,
  BUILTIN_ACTION_ID.DETAIL,
  BUILTIN_ACTION_ID.DELETE,
] as const
export const BUILTIN_BULK_ACTION_IDS = [BUILTIN_ACTION_ID.DELETE_SELECTED] as const

/** 按 id 合并定义：后者按字段覆盖前者 */
export function mergeDefinitions<D extends {id: string}>(...lists: Array<D[] | undefined>): D[] {
  const map = new Map<string, D>()
  for (const def of lists.flatMap((list) => list ?? [])) {
    const existing = map.get(def.id)
    map.set(def.id, existing ? {...existing, ...def} : def)
  }
  return [...map.values()]
}

export function overrideAction<D extends {id: string}>(
  definitions: D[],
  id: string,
  patch: Partial<D>,
): D[] {
  return definitions.map((def) => (def.id === id ? {...def, ...patch} : def))
}

export interface ActionResolver {
  resolveToolbarActions: <TItem extends BasicIdMetadata<unknown>>(
    definitions: ToolbarActionDefinition<TItem>[],
    context: ToolbarActionContext<TItem>,
    auth: ActionAuth,
  ) => ResolvedAction[]
  resolveRecordActions: <TItem extends BasicIdMetadata<unknown>>(
    definitions: RecordActionDefinition<TItem>[],
    context: RecordActionContext<TItem>,
    auth: ActionAuth,
  ) => ResolvedAction[]
}

/**
 * 建一个带运行态的 action 解析器。
 *
 * loading 必须存在组件实例自己的 ref 里：写成模块级单例会让页面上所有表格
 * 共享同一份运行态，A 表格点了删除，B 表格的删除按钮也会转圈。
 * 每个组件在 setup 里调一次，把返回的 resolve* 用于该实例的全部动作。
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

  /**
   * 工具栏 / 批量共用一个键：`toolbar:<id>`。
   * 行内动作按记录 id 分桶，否则第 1 行的异步动作会把所有行的同名按钮一起置灰。
   */
  const toolbarRunKey = <TItem extends BasicIdMetadata<unknown>>(
    def: ToolbarActionDefinition<TItem>,
  ) => `toolbar:${def.id}`

  const recordRunKey = <TItem extends BasicIdMetadata<unknown>>(
    def: RecordActionDefinition<TItem>,
    context: RecordActionContext<TItem>,
  ) =>
    context.record == null
      ? `toolbar:${def.id}`
      : `item:${String(context.record[SYSTEM_CONSTANT.ID_NAME])}:${def.id}`

  function resolve<TItem extends BasicIdMetadata<unknown>, C extends ActionContext>(
    definitions: ActionDefinitionBase<TItem, C>[],
    context: C,
    auth: ActionAuth,
    runKey: (def: ActionDefinitionBase<TItem, C>, context: C) => string,
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

  return {
    resolveToolbarActions: (definitions, context, auth) =>
      resolve(definitions, context, auth, toolbarRunKey),
    resolveRecordActions: (definitions, context, auth) =>
      resolve(definitions, context, auth, recordRunKey),
  }
}

/** 建"工具栏 / 批量"的动作上下文：数据与选中由壳给，`message`/`modal` 也由壳注入 */
export function buildToolbarActionContext<TItem extends BasicIdMetadata<unknown>>(options: {
  items: TItem[]
  selectedItems?: TItem[]
  query?: FilterRequest | PageRequest
  app: ActionAppApis
}): ToolbarActionContext<TItem> {
  const {items, selectedItems, query, app} = options
  return {
    items,
    selectedItems: selectedItems ?? [],
    query,
    message: app.message,
    modal: app.modal,
  }
}

/** 建"行内 / 项内"的动作上下文：只有当前记录 + 壳注入的 `message`/`modal` */
export function buildRecordActionContext<TItem extends BasicIdMetadata<unknown>>(options: {
  record: TItem
  app: ActionAppApis
}): RecordActionContext<TItem> {
  return {
    record: options.record,
    message: options.app.message,
    modal: options.app.modal,
  }
}

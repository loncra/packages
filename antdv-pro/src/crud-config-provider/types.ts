import type {ComputedRef, InjectionKey} from 'vue'
import type {RestResult} from '@loncra/client/commons'

export interface CrudConfig {
  /** 权限判定；缺省时一律判为无权限 */
  hasPermission?: (permission: string) => boolean
  /** 列表页默认标题；组件 title / titleIcon props 与 #title 插槽优先 */
  resolveDefaultTitle?: () => {title?: string; icon?: string}
  /** 导出成功后的统一后处理 */
  onExported?: (result: RestResult<void>) => void
}

export interface ActionAuth {
  can: (permission?: string | boolean) => boolean
}

export const CRUD_CONFIG_KEY: InjectionKey<ComputedRef<CrudConfig>> = Symbol('loncraCrudConfig')

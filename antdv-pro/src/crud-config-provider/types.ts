import type {ComputedRef, InjectionKey, VNodeChild} from 'vue'
import type {FieldComponentSpec, ValueFormatter} from '../crud-page/types'
import type {CrudNavigateTarget} from '../_util/crud/navigate'
import type {StaleCheckMode} from '../_util/crud/useStaleCheck'

export interface CrudConfig {
  hasPermission?: (permission: string) => boolean
  i18nResolver?: (key: string, named?: Record<string, unknown>) => string
  resolveDefaultTitle?: () => VNodeChild
  onNavigate?: (target: CrudNavigateTarget) => void
  fieldComponents?: Record<string, FieldComponentSpec>
  formatters?: Record<string, ValueFormatter>
  dateFormat?: string
  dateTimeFormat?: string
  staleCheck?: StaleCheckMode
}

export const CRUD_CONFIG_KEY: InjectionKey<ComputedRef<CrudConfig>> = Symbol('loncraCrudConfig')

export type CrudConfigProviderProps = CrudConfig

export interface CrudConfigProviderSlots {
  default?: () => unknown
}

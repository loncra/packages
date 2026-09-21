import type {ComputedRef, InjectionKey, VNodeChild} from 'vue'
import type {FieldComponentSpec, ValueFormatter} from '../crud-page/types'
import type {CrudNavigateTarget} from '../_util/crud/navigate'

export interface CrudConfig {
  /** 权限判定；缺省时一律判为无权限 */
  hasPermission?: (permission: string) => boolean
  /**
   * **默认**文案解析：key → 文案（宿主给一行 `(key, named) => i18n.global.t(key, named)`）。
   * 页面声明（`CrudPageCore.i18nResolver`）优先，页面没给才用它；
   * 两处都没有才回退渲染 key 本身（可见、可调试，不静默变空）。pro 本身不认 i18n。
   */
  i18nResolver?: (key: string, named?: Record<string, unknown>) => string
  /**
   * 列表页默认标题：**宿主自己拼成 VNode 给过来**（图标、文案、结构都是宿主的事，pro 不认）。
   * 组件的 `title` prop（`VNode` / `false`）与 `#title` 插槽优先于它。
   */
  resolveDefaultTitle?: () => VNodeChild
  /**
   * 跳转的**兜底**实现：页面声明没给 `CrudPageCore.onNavigate` 时才用它。
   * `BasicIdMetadata.id` 是可选字段，宿主自己判空。
   */
  onNavigate?: (target: CrudNavigateTarget) => void
  /**
   * 字段组件表：按 key 覆盖内置表（`registry.ts` 的 `usePageRegistry()`），用于登记业务私有控件。
   * 只想加一个就 `{myWidget: {component: MyWidget}}`。
   */
  fieldComponents?: Record<string, FieldComponentSpec>
  /** 值格式表：同上，按 key 覆盖 `usePageRegistry()` 里的内置格式表 */
  formatters?: Record<string, ValueFormatter>
  /**
   * 显示用日期格式（dayjs token）。宿主注入 `import.meta.env.VITE_APP_DATE_VALUE_FORMAT`；
   * 不注入就用 pro 的默认 `YYYY-MM-DD`。**只影响显示**：后端要的时间格式由宿主自己管。
   */
  dateFormat?: string
  /** 同上，日期 + 时间（宿主注入 `VITE_APP_DATE_TIME_VALUE_FORMAT`） */
  dateTimeFormat?: string
}

export const CRUD_CONFIG_KEY: InjectionKey<ComputedRef<CrudConfig>> = Symbol('loncraCrudConfig')

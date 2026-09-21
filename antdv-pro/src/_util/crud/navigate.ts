import type {BasicIdMetadata} from '@loncra/client/commons'

/** 跳转语义：列表入口 / 新增 / 编辑 / 详情（表单壳以后复用 home） */
export type CrudNavigateKind = 'home' | 'add' | 'edit' | 'detail'

/**
 * 跳转目标。泛型参数是"记录"的类型：
 * - app 级兜底（`CrudConfig.onNavigate`）用默认实参 —— 宽类型，读业务字段要断言；
 * - 页面声明层（`CrudPageCore.onNavigate`）传页面自己的 `TEntity` —— 精确。
 *
 * 住 `_util/crud/`：app 级配置（`crud-config-provider`）与页面声明层（`crud-page`）都要引它，
 * 放任何一侧都会让另一侧反向依赖。
 */
export interface CrudNavigateTarget<TRecord = BasicIdMetadata<unknown>> {
  kind: CrudNavigateKind
  /** 页面声明的 `routes[kind]`；声明没写就是 undefined（宿主应当忽略这次跳转） */
  name?: string
  /** edit / detail 的当前行；add / home 为空 */
  record?: TRecord
  /** 宿主形态名：宿主自己起名（如 `'picker'`）；不传 = 宿主没给形态名（整页） */
  variant?: string
}

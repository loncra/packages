import type {VNode, VNodeChild} from 'vue'

/** 消费者自己的加载内容：时机由 plan 定，内容由消费者实现 */
export type DataLoadingTask = () => unknown | Promise<unknown>

export interface DataLoadingCardPlanProps {
  /** 加载态（双向绑定的 model）。plan 在触发 `onMounted` / `onActivated` 期间点亮它 */
  loading?: boolean
  /** `onMounted` 时机要跑的内容 */
  onMounted?: DataLoadingTask
  /** `onActivated` 时机要跑的内容（首次 activated 跳过，那次交给 `onMounted`） */
  onActivated?: DataLoadingTask
  /**
   * 卡片头：给 VNode 就直接用它；给 `false` 不要卡片头；
   * 不给（或用 `#title` 插槽）则用 `CrudConfig.resolveDefaultTitle()`。
   */
  title?: VNode | boolean
  /**
   * **内嵌形态**：不渲染卡片壳（只留一个裸容器，`attrs` 照旧落上去），并且**不消费
   * `title` / `#extra` 插槽、不出外层 `Spin`** —— 标题与加载态都归内容自己（表格用它的
   * `loading`）。生命周期编排（`onMounted` / `onActivated` + `loading`）不变。
   */
  plain?: boolean
  /**
   * 内容区是否套 `Spin`：`true`（默认）= 转圈盖住内容区（form / detail 的"初始加载 + 提交"要它）；
   * `false` = 内容自己管加载态。**CRUD 列表关掉它**：表格自带 `loading`，再套一层就是两层遮罩。
   */
  spin?: boolean
}

export interface DataLoadingCardPlanSlots {
  /** 卡片内容 */
  default?: () => VNodeChild
  /** 页面自带标题时优先它（否则用 `title` / `CrudConfig.resolveDefaultTitle`） */
  title?: () => VNodeChild
  /** 卡片右上角 */
  extra?: () => VNodeChild
}

export type DataLoadingCardPlanEmits = {
  'update:loading': (value: boolean) => void
}

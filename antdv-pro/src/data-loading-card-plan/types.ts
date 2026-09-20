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

import type {VNode, VNodeChild} from 'vue'

export type DataLoadingTask = () => unknown | Promise<unknown>

export interface DataLoadingCardProps {
  loading?: boolean
  onMounted?: DataLoadingTask
  onActivated?: DataLoadingTask
  title?: VNode | boolean
  plain?: boolean
  spin?: boolean
}

export interface DataLoadingCardSlots {
  default?: () => VNodeChild
  title?: () => VNodeChild
  extra?: () => VNodeChild
}

export type DataLoadingCardEmits = {
  'update:loading': (value: boolean) => void
}

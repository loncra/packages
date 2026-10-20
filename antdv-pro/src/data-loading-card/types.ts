import type {VNode, VNodeChild} from 'vue'
import type {CardProps, SpinProps} from 'antdv-next'

export type DataLoadingTask = () => unknown | Promise<unknown>

export interface DataLoadingCardClasses {
  card?: CardProps['classes']
  spin?: SpinProps['classes']
}

export interface DataLoadingCardStyles {
  card?: CardProps['styles']
  spin?: SpinProps['styles']
}

export interface DataLoadingCardProps {
  loading?: boolean
  onMounted?: DataLoadingTask
  onActivated?: DataLoadingTask
  title?: VNode | boolean
  plain?: boolean
  spin?: boolean
  rootClass?: string
  classes?: DataLoadingCardClasses
  styles?: DataLoadingCardStyles
}

export interface DataLoadingCardSlots {
  default?: () => VNodeChild
  title?: () => VNodeChild
  extra?: () => VNodeChild
}

export type DataLoadingCardEmits = {
  'update:loading': (value: boolean) => void
}

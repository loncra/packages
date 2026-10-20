import type {TooltipProps} from 'antdv-next'

export interface TooltipValidationFormItemProps {
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: TooltipProps['classes']
  styles?: TooltipProps['styles']
}

export interface TooltipValidationFormItemSlots {
  default?: () => unknown
}

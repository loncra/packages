import type {ImageProps} from 'antdv-next'

export interface BasicImageProps {
  preview?: boolean
  fallback?: string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: ImageProps['classes']
  styles?: ImageProps['styles']
}

export interface BasicImageSlots {
  cover?: () => unknown
  fallback?: () => unknown
  placeholder?: () => unknown
}

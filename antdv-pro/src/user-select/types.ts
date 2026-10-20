import type {PlatformUser} from '@loncra/client/auth'

export interface UserSelectOption {
  label?: string
  value?: string | number
  options?: UserSelectOption[]
  payload?: PlatformUser
  data?: {
    payload?: PlatformUser
    label?: string
  }
}

export interface UserSelectProps {
  value?: string | string[]
  ignoreTypes?: string[]
  valueField?: keyof PlatformUser
  compactButton?: boolean
  query?: Record<string, string>
  mode?: 'multiple' | 'tags'
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface UserSelectEmits {
  'update:value': (value: string | string[]) => void
  change: (value: string, option: Record<string, unknown>) => void
}

export interface UserSelectSlots {
  optionRender?: (ctx: {option: UserSelectOption}) => unknown
  popupRender?: (ctx: {menu: unknown}) => unknown
  labelRender?: (ctx: Record<string, unknown>) => unknown
  tagRender?: (ctx: Record<string, unknown>) => unknown
}

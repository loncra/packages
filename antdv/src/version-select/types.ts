import type {CSSProperties} from 'vue'
import type {ButtonProps, SelectProps} from 'antdv-next'

export interface VersionSelectClasses {
  root?: string
  select?: SelectProps['classes']
  upgrade?: ButtonProps['classes']
  latest?: string
}

export interface VersionSelectStyles {
  root?: CSSProperties
  select?: SelectProps['styles']
  upgrade?: ButtonProps['styles']
  latest?: CSSProperties
}

export interface VersionSelectProps {
  value?: string
  options?: SelectProps['options']
  disabled?: boolean
  separator?: string
  prefixCls?: string
  rootClass?: string
  classes?: VersionSelectClasses
  styles?: VersionSelectStyles
}

export interface VersionSelectEmits {
  'update:value': (value: string) => void
  change: (value: string) => void
  upgrade: (latest: string) => void
}

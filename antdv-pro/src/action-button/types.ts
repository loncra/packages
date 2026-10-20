import type {ButtonProps, ButtonSize, DropdownProps} from 'antdv-next'
import type {ResolvedAction} from '../_util/crud/actions'

export interface ActionButtonClasses {
  button?: ButtonProps['classes']
  dropdown?: DropdownProps['classes']
}

export interface ActionButtonStyles {
  button?: ButtonProps['styles']
  dropdown?: DropdownProps['styles']
}

export interface ActionButtonProps {
  actions?: ResolvedAction[]
  size?: ButtonSize
  alwaysDropdown?: boolean
  type?: ButtonProps['type']
  rootClass?: string
  classes?: ActionButtonClasses
  styles?: ActionButtonStyles
}

export interface ActionButtonEmits {
  action: (id: string) => void
}

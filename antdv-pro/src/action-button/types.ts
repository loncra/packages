import type {ButtonProps, ButtonSize} from 'antdv-next'
import type {ResolvedAction} from '../_util/crud/actions'

export interface ActionButtonProps {
  actions?: ResolvedAction[]
  size?: ButtonSize
  alwaysDropdown?: boolean
  type?: ButtonProps['type']
}

export interface ActionButtonEmits {
  action: (id: string) => void
}

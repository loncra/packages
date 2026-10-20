import type {ModalProps} from 'antdv-next'

export interface QrCodeModalProps {
  url: string
  open?: boolean
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: ModalProps['classes']
  styles?: ModalProps['styles']
}

export interface QrCodeModalEmits {
  'update:open': (open: boolean) => void
}

export interface QrCodeModalSlots {
  copyIcon?: (ctx: { copied: boolean }) => unknown
}

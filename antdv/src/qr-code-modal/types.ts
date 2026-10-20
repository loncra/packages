import type {CSSProperties} from 'vue'
import type {ButtonProps, InputProps, ModalProps, QRCodeProps} from 'antdv-next'

export interface QrCodeModalClasses {
  modal?: ModalProps['classes']
  content?: string
  qrcode?: QRCodeProps['classes']
  urlInput?: InputProps['classes']
  copyButton?: ButtonProps['classes']
}

export interface QrCodeModalStyles {
  modal?: ModalProps['styles']
  content?: CSSProperties
  qrcode?: QRCodeProps['styles']
  urlInput?: InputProps['styles']
  copyButton?: ButtonProps['styles']
}

export interface QrCodeModalProps {
  url: string
  open?: boolean
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: QrCodeModalClasses
  styles?: QrCodeModalStyles
}

export interface QrCodeModalEmits {
  'update:open': (open: boolean) => void
}

export interface QrCodeModalSlots {
  copyIcon?: (ctx: { copied: boolean }) => unknown
}

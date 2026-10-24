import type {CSSProperties} from 'vue'
import type {ButtonProps, PopoverProps} from 'antdv-next'

export interface EmojiButtonProps {
  class?: unknown
  rootClass?: string
  style?: unknown
  prefixCls?: string
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text'
  disabled?: boolean
  hiddenSlugs?: string[]
}

export interface EmojiButtonEmits {
  selected: (emoji: string) => void
}

export interface EmojiButtonSlots {
  icon?: () => unknown
}

export interface EmojiButtonClasses {
  root?: ButtonProps['classes']
  popover?: PopoverProps['classes']
  panel?: string
  body?: string
  cell?: string
  emoji?: string
}

export interface EmojiButtonStyles {
  root?: ButtonProps['styles']
  popover?: PopoverProps['styles']
  panel?: CSSProperties
  body?: CSSProperties
  cell?: CSSProperties
  emoji?: CSSProperties
}

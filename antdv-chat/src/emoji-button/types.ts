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

import type {XMarkdownProps} from '@antdv-next/x-markdown'

export type MarkdownTheme = 'light' | 'dark'

export interface MarkdownProps extends XMarkdownProps {
  theme?: MarkdownTheme
  prefixCls?: string
  rootClass?: string
}

export interface MarkdownSlots {
  default?: () => unknown
}

export interface MarkdownCodeRendererProps {
  class?: unknown
}

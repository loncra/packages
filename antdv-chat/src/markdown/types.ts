import type {CSSProperties} from 'vue'
import type {XMarkdownProps} from '@antdv-next/x-markdown'

export type MarkdownTheme = 'light' | 'dark'

export interface MarkdownProps extends XMarkdownProps {
  nearBottomPx?: number
  theme?: MarkdownTheme
  prefixCls?: string
  rootClass?: string
  classes?: MarkdownClasses
  styles?: MarkdownStyles
}

export interface MarkdownSlots {
  default?: () => unknown
}

export interface MarkdownClasses {
  root?: string
  markdown?: string
}

export interface MarkdownStyles {
  root?: CSSProperties
  markdown?: CSSProperties
}

export interface MarkdownCodeRendererProps {
  class?: unknown
}

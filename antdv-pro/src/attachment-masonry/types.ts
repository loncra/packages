import type {CSSProperties} from 'vue'
import type {CardProps, EmptyProps, MasonryProps} from 'antdv-next'
import type {ObjectItemInfo} from '@loncra/client/resource'

export interface AttachmentMasonryClasses {
  root?: string
  cover?: string
  placeholder?: string
  fileIcon?: string
  card?: CardProps['classes']
  masonry?: MasonryProps['classes']
  empty?: EmptyProps['classes']
}

export interface AttachmentMasonryStyles {
  root?: CSSProperties
  cover?: CSSProperties
  placeholder?: CSSProperties
  fileIcon?: CSSProperties
  card?: CardProps['styles']
  masonry?: MasonryProps['styles']
  empty?: EmptyProps['styles']
}

export interface AttachmentMasonryProps {
  bucket?: string
  dataSource?: ObjectItemInfo[]
  checkValue?: ObjectItemInfo[]
  classes?: AttachmentMasonryClasses
  styles?: AttachmentMasonryStyles
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface AttachmentMasonryEmits {
  'update:checkValue': (value: ObjectItemInfo[]) => void
}

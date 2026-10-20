import type {ObjectItemInfo} from '@loncra/client/resource'

export interface AttachmentMasonryProps {
  bucket?: string
  dataSource?: ObjectItemInfo[]
  checkValue?: ObjectItemInfo[]
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface AttachmentMasonryEmits {
  'update:dataSource': (value: ObjectItemInfo[]) => void
  'update:checkValue': (value: ObjectItemInfo[]) => void
}

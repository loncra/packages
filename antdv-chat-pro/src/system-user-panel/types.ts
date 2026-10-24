import type {CSSProperties} from 'vue'
import type {DividerProps} from 'antdv-next'
import type {ConversationsProps} from '@antdv-next/x'
import type {PlatformUser} from '@loncra/client/auth'

export interface SystemUserContactItem {
  key: string
  label?: string
  data: PlatformUser
  disabled?: boolean
  group?: string
  [key: string]: unknown
}

export interface SystemUserPanelClasses {
  list?: string
  search?: string
  conversations?: ConversationsProps['classes']
  selectedPanel?: string
  selectedDivider?: Exclude<DividerProps['classes'], Function>
  selectedItem?: string
  empty?: string
}

export interface SystemUserPanelStyles {
  list?: CSSProperties
  search?: CSSProperties
  conversations?: ConversationsProps['styles']
  selectedPanel?: CSSProperties
  selectedDivider?: Exclude<DividerProps['styles'], Function>
  selectedItem?: CSSProperties
  empty?: CSSProperties
}

export interface SystemUserPanelProps {
  dataSource?: SystemUserContactItem[]
  value?: SystemUserContactItem[]
  selected?: boolean
  filter?: (item: SystemUserContactItem) => boolean
  hideSelectPanel?: boolean
  hideSearch?: boolean
  avatarSize?: string | number
  prefixCls?: string
  rootClass?: string
  classes?: SystemUserPanelClasses
  styles?: SystemUserPanelStyles
}

export interface SystemUserPanelEmits {
  selected: (body: PlatformUser) => void
  'update:value': (value: SystemUserContactItem[]) => void
}

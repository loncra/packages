import type {CSSProperties} from 'vue'
import type {MenuProps} from 'antdv-next'

export interface ConversationNode {
  key: string
  name: string
  timeText?: string
  children?: ConversationNode[]
  editing?: boolean
}

export interface ConversationListProps {
  items: ConversationNode[]
  selectedKeys: string[]
  openKeys: string[]
  loading?: boolean
  actionsVisible?: boolean
  prefixCls?: string
  rootClass?: string
  classes?: ConversationListClasses
  styles?: ConversationListStyles
}

export interface ConversationListEmits {
  'update:selectedKeys': (keys: string[]) => void
  'update:openKeys': (keys: string[]) => void
  active: (key: string) => void
}

export interface ConversationListClasses {
  menu?: Exclude<MenuProps['classes'], Function>
  empty?: string
}

export interface ConversationListStyles {
  menu?: MenuProps['styles']
  empty?: CSSProperties
}

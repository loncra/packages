import type {CSSProperties, VNodeChild} from 'vue'
import type {
  AvatarProps,
  ButtonProps,
  InputProps,
  PopoverProps,
  SelectProps,
  TabsProps,
} from 'antdv-next'
import type {SearchProps} from 'antdv-next/dist/input/Search'
import type {ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE} from './constants'

export interface IconfontGlyph {
  font_class: string
  name: string
  icon_id: string
  unicode: string
  unicode_decimal: number
}

export interface IconfontJson {
  name: string
  css_prefix_text: string
  description: string
  glyphs: IconfontGlyph[]
}

export type IconSelectModeType = (typeof ICON_SELECT_MODE)[keyof typeof ICON_SELECT_MODE]

export type IconSelectAvatarModeValueType =
  (typeof ICON_SELECT_AVATAR_MODE_VALUE)[keyof typeof ICON_SELECT_AVATAR_MODE_VALUE]

export interface IconSelectClasses {
  root?: string
  tabs?: TabsProps['classes']
  search?: SearchProps['classes']
  packName?: string
  codeInput?: InputProps['classes']
  glyph?: ButtonProps['classes']
  avatar?: string
  compact?: string
  select?: SelectProps['classes']
  payload?: InputProps['classes']
  input?: InputProps['classes']
  popover?: PopoverProps['classes'] & {
    tabs?: TabsProps['classes']
    search?: SearchProps['classes']
  }
}

export interface IconSelectStyles {
  root?: CSSProperties
  tabs?: TabsProps['styles']
  search?: SearchProps['styles']
  packName?: CSSProperties
  codeInput?: InputProps['styles']
  glyph?: ButtonProps['styles']
  avatar?: CSSProperties
  compact?: CSSProperties
  select?: SelectProps['styles']
  payload?: InputProps['styles']
  input?: InputProps['styles']
  popover?: PopoverProps['styles'] & {
    tabs?: TabsProps['styles']
    search?: SearchProps['styles']
  }
}

export interface IconSelectProps {
  value?: string
  options?: IconfontJson[]
  mode?: IconSelectModeType
  preview?: boolean
  iconRender?: (type: string) => VNodeChild
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
  size?: AvatarProps['size']
  classes?: IconSelectClasses
  styles?: IconSelectStyles
}

export interface IconSelectEmits {
  'update:value': (value: string) => void
}

export interface IconSelectSlots {
  afterAvatar?: () => unknown
}

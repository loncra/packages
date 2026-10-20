import type {VNodeChild} from 'vue'
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
}

export interface IconSelectEmits {
  'update:value': (value: string) => void
}

export interface IconSelectSlots {
  afterAvatar?: () => unknown
}

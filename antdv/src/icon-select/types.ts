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

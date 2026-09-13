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

export const ICON_SELECT_MODE = {
  VIEW: 'view',
  AVATAR: 'avatar',
  INPUT: 'input',
} as const

export const ICON_SELECT_AVATAR_MODE_VALUE = {
  ICON: 'icon://',
  AVATAR: 'avatar://',
  INPUT: 'text://',
} as const

export const AVATAR_SCHEMES = [
  ICON_SELECT_AVATAR_MODE_VALUE.ICON,
  ICON_SELECT_AVATAR_MODE_VALUE.AVATAR,
  ICON_SELECT_AVATAR_MODE_VALUE.INPUT,
] as const

export type IconSelectModeType = (typeof ICON_SELECT_MODE)[keyof typeof ICON_SELECT_MODE]

export type IconSelectAvatarModeValueType =
  (typeof ICON_SELECT_AVATAR_MODE_VALUE)[keyof typeof ICON_SELECT_AVATAR_MODE_VALUE]

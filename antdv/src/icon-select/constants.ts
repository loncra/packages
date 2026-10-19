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

import type {IconSelectLocale} from '../locale'
import {AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE} from './constants'
import type {IconfontGlyph, IconfontJson, IconSelectAvatarModeValueType} from './types'

export function glyphType(pack: IconfontJson, glyph: IconfontGlyph) {
  return pack.css_prefix_text + glyph.font_class
}

export function parseAvatarModel(raw: string) {
  const value = raw ?? ''
  const type = AVATAR_SCHEMES.find((scheme) => value.startsWith(scheme))
  if (!type) {
    return {type: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR, payload: value}
  }
  return {type, payload: value.slice(type.length)}
}

export function toAvatarModel(type: IconSelectAvatarModeValueType, payload: string) {
  const text = payload ?? ''
  return text ? `${type}${text}` : ''
}

export function avatarModeOptions(
  options: IconfontJson[],
  locale: Pick<IconSelectLocale, 'link' | 'name' | 'icon'>,
) {
  const result: { label: string; value: IconSelectAvatarModeValueType }[] = [
    { label: locale.link, value: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR },
    { label: locale.name, value: ICON_SELECT_AVATAR_MODE_VALUE.INPUT },
  ]
  if (options.length > 0) {
    result.push({ label: locale.icon, value: ICON_SELECT_AVATAR_MODE_VALUE.ICON })
  }
  return result
}

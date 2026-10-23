import type {EditorLocale} from './types'

export function resolveEditorLocale(
  configLocale: unknown,
  propLocale?: EditorLocale,
): EditorLocale {
  if (propLocale) {
    return propLocale
  }
  const locale = (configLocale as { locale?: string } | undefined)?.locale
  if (locale === 'en-US' || locale?.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

export function isEditorEditable(disabled: boolean, editable: boolean) {
  return !disabled && editable !== false
}

import type {ComputedRef} from 'vue'
import {createUseLocale} from '@loncra/antdv'
import defaultLocale from '../locale/zh_CN'
import type {Locale} from '../locale'

/** antdv-chat-pro 的 locale 组件名（由本包的 `Locale` 推出） */
export type LocaleComponentName = Exclude<keyof Locale, 'locale'>

/**
 * locale 合并规则与 `@loncra/antdv` 共用 `createUseLocale`。
 * 默认中文，宿主把本包语言包并进 ConfigProvider 的 `locale` 后按当前语言覆盖。
 */
export const useLocale: <C extends LocaleComponentName>(
  componentName: C,
) => ComputedRef<NonNullable<Locale[C]>> = createUseLocale(defaultLocale)

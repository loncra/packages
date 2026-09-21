import type {ComputedRef} from 'vue'
import {createUseLocale} from '@loncra/antdv'
import defaultLocale from '../locale/zh_CN'
import type {Locale} from '../locale'

/** pro 的 locale 组件名（由本包的 `Locale` 推出；组件集与 `@loncra/antdv` 不同） */
export type LocaleComponentName = Exclude<keyof Locale, 'locale'>

/**
 * locale 合并规则与 `@loncra/antdv` **共用一套工厂**（`createUseLocale`），
 * 只有默认语言包与本包的 `Locale` 类型是自己的。签名保持原样，消费方零改动。
 */
export const useLocale: <C extends LocaleComponentName>(
  componentName: C,
) => ComputedRef<NonNullable<Locale[C]>> = createUseLocale(defaultLocale)

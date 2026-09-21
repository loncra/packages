import {computed, type ComputedRef} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import defaultLocale from '../locale/zh_CN'
import type {Locale} from '../locale'

export type LocaleComponentName = Exclude<keyof Locale, 'locale'>

/**
 * "provider 覆盖包内默认"的 locale 合并。两个包各有自己的 `Locale`（组件集不同）与默认语言包，
 * 但合并规则只有这一条 ⇒ 抽成工厂，`@loncra/antdv` 与 `@loncra/antdv-pro` 各调一次。
 */
export function createUseLocale<L extends object>(fallback: L) {
  return function useLocale<C extends Exclude<keyof L, 'locale'>>(
    componentName: C,
  ): ComputedRef<NonNullable<L[C]>> {
    const config = useConfig()
    return computed(() => {
      const providerLocale = config.value.locale as Partial<L> | undefined
      const fromProvider = (providerLocale as Record<string, unknown> | undefined)?.[
        componentName as string
      ]
      const own = (fallback as Record<string, unknown>)[componentName as string]
      return {
        ...(own as object),
        ...(fromProvider as object),
      } as NonNullable<L[C]>
    })
  }
}

export const useLocale = createUseLocale(defaultLocale)

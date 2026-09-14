import {computed, type ComputedRef} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import defaultLocale from '../locale/zh_CN'
import type {Locale} from '../locale'

export type LocaleComponentName = Exclude<keyof Locale, 'locale'>

export function useLocale<C extends LocaleComponentName>(
  componentName: C,
): ComputedRef<NonNullable<Locale[C]>> {
  const config = useConfig()
  return computed(() => {
    const providerLocale = config.value.locale as (Locale & Record<string, unknown>) | undefined
    const fromProvider = providerLocale?.[componentName]
    const fallback = defaultLocale[componentName]
    return {
      ...(fallback as object),
      ...(fromProvider as object),
    } as NonNullable<Locale[C]>
  })
}

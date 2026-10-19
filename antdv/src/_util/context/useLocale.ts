import {computed, type ComputedRef} from 'vue'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import defaultLocale from '../../locale/zh_CN'
import type {Locale} from '../../locale'

export type LocaleComponentName = Exclude<keyof Locale, 'locale'>

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

export function fillLocale(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)}/g, (_match, key: string) => String(params[key] ?? ''))
}

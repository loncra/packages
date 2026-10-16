import {genStyleUtils} from '@antdv-next/cssinjs/cssinjs-utils'
import {useConfig} from 'antdv-next/config-provider/context'
import {genCommonStyle, genIconStyle, genLinkStyle} from 'antdv-next/dist/style/index'
import {unitless} from 'antdv-next/dist/theme/useToken'
import {useToken} from 'antdv-next/theme/internal'
import {computed, effectScope} from 'vue'
import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {AliasToken, TokenWithCommonCls} from 'antdv-next/theme/internal'
import type {ComputedRef, Ref} from 'vue'

export type LoncraStyleToken = TokenWithCommonCls<AliasToken>

type GenerateStyle = (token: LoncraStyleToken) => CSSInterpolation

type UseStyle = (
  prefixCls: Ref<string>,
) => readonly [Ref<string>, ComputedRef<string | undefined>]

type StyleOptions = {order?: number; resetStyle?: boolean}

type GenStyleHooks = (
  component: string,
  styleFn: GenerateStyle,
  options?: StyleOptions,
) => UseStyle

type FactoryGenStyleHooks = (
  component: string,
  styleFn: GenerateStyle,
  getDefaultToken?: undefined,
  options?: StyleOptions,
) => UseStyle

function useStyleToken() {
  const [theme, realToken, hashId, token, cssVar, zeroRuntime] = useToken()
  return {theme, realToken, hashId, token, cssVar, zeroRuntime}
}

const prefixCache = new WeakMap<object, unknown>()
const cspCache = new WeakMap<object, unknown>()

function memoByConfig<T>(cache: WeakMap<object, unknown>, create: (config: any) => T): T {
  const config = useConfig() as unknown as object
  const cached = cache.get(config) as T | undefined
  if (cached) return cached
  const created = effectScope(true).run(() => computed(() => create(config)))
  cache.set(config, created)
  return created as unknown as T
}

export function createStyleHooks(layer: string): GenStyleHooks {
  const layerStyleUtils = genStyleUtils({
    usePrefix: () =>
      memoByConfig(prefixCache, (config: any) => {
        const {getPrefixCls, iconPrefixCls} = config.value
        return {rootPrefixCls: getPrefixCls(), iconPrefixCls}
      }),
    useToken: useStyleToken,
    useCSP: () => memoByConfig(cspCache, (config: any) => config.value?.csp ?? {}),
    getResetStyles: (token: any, config: any) => {
      const linkStyle = genLinkStyle(token)
      const {prefix} = config ?? {}
      return [
        linkStyle,
        {'&': linkStyle},
        genIconStyle(prefix?.value?.iconPrefixCls ?? 'anticon'),
      ]
    },
    getCommonStyle: genCommonStyle,
    getCompUnitless: () => unitless,
    layer: {name: layer},
  } as never)

  const factoryGenStyleHooks = layerStyleUtils.genStyleHooks as unknown as FactoryGenStyleHooks

  return (component, styleFn, options) =>
    factoryGenStyleHooks(component, styleFn, undefined, options)
}

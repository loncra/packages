import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks as antGenStyleHooks} from 'antdv-next/theme/internal'
import type {ComputedRef, Ref} from 'vue'
import type {LoncraStyleToken} from './styleFactory'

export type {LoncraStyleToken}

type GenerateStyle = (token: LoncraStyleToken) => CSSInterpolation

type UseStyle = (
  prefixCls: Ref<string>,
) => readonly [Ref<string>, ComputedRef<string | undefined>]

export function genStyleHooks(
  component: string,
  styleFn: GenerateStyle,
  options?: {order?: number; resetStyle?: boolean},
): UseStyle {
  return (
    antGenStyleHooks as unknown as (
      name: string,
      fn: GenerateStyle,
      getDefaultToken?: undefined,
      options?: {order?: number; resetStyle?: boolean},
    ) => UseStyle
  )(component, styleFn, undefined, options)
}

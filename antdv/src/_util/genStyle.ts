import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks as antGenStyleHooks} from 'antdv-next/theme/internal'
import type {ComputedRef, Ref} from 'vue'

export interface LoneraStyleToken {
  componentCls: string
  prefixCls: string
  antCls: string
  [key: string]: unknown
}

export type LoneraGenerateStyle = (token: LoneraStyleToken) => CSSInterpolation

type UseStyle = (
  prefixCls: Ref<string>,
) => readonly [Ref<string>, ComputedRef<string | undefined>]

export function genStyleHooks(component: string, styleFn: LoneraGenerateStyle): UseStyle {
  return (antGenStyleHooks as unknown as (name: string, fn: LoneraGenerateStyle) => UseStyle)(
    component,
    styleFn,
  )
}

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {AliasToken, TokenWithCommonCls} from 'antdv-next/theme/internal'
import {genStyleHooks as antGenStyleHooks} from 'antdv-next/theme/internal'
import type {ComputedRef, Ref} from 'vue'

/** genStyleHooks 注入的尺寸/颜色已是 CSS 变量（如 `var(--ant-padding-xs)`），禁止 Number()。 */
export type LoncraStyleToken = TokenWithCommonCls<AliasToken>

type GenerateStyle = (token: LoncraStyleToken) => CSSInterpolation

type UseStyle = (
  prefixCls: Ref<string>,
) => readonly [Ref<string>, ComputedRef<string | undefined>]

export function genStyleHooks(component: string, styleFn: GenerateStyle): UseStyle {
  return (antGenStyleHooks as unknown as (name: string, fn: GenerateStyle) => UseStyle)(
    component,
    styleFn,
  )
}

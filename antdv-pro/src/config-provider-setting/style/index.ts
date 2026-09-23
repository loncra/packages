import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

/**
 * 配置面板的样式（**pro 不带 Tailwind，也不写内联 `style`** ⇒ 全部走 CSS-in-JS）。
 *
 * 这三条以前是写在 JSX 上的内联 `style`，2026-09-23 按规矩挪过来：
 * 静态值直接写死；跟随主题的那条（子标题字号）用 token —— 比内联更稳（换主题也会跟着变）。
 */
function genConfigProviderSettingStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, fontSizeSM} = token

  return {
    /** 行标签：不换行（`space-between` 两列，标签一折行就错位） */
    [`${componentCls}-row-label`]: {whiteSpace: 'nowrap'},
    /** 行的副标题：比正文小一号 */
    [`${componentCls}-row-sub`]: {fontSize: fontSizeSM},
    /** token 输入框：阴影值是长串（`0 6px 16px 0 rgba(…)`），窄了看不清 */
    [`${componentCls}-token-input`]: {width: 420},
  }
}

export default genStyleHooks('ConfigProviderSetting', genConfigProviderSettingStyle)

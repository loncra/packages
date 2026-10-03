import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 联系人面板（`./Contact.tsx`）的默认样式。
 *
 * ⚠️ **包内两条样式纪律**（2026-10-03 用户立）：
 * - ③ 禁宿主 Tailwind 类（`check-package-discipline.cjs`）；
 * - ④ **禁字面量内联 style**（`style={{…}}` / `style="…"`）⇒ 结构/尺寸一律落在这里（token 化），
 *   组件里**只透传**调用方的 `class` / `style`。
 *
 * 这里只承担原宿主模板的 `h-full min-h-0 overflow-hidden`（撑满 + 自成滚动上下文）与空态占位。
 */
function genImContactStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',

      // 空态：占满剩余高度（居中由 antd `Flex` 的 justify/align 提供 —— 原 `size-full`）
      [`${componentCls}-empty`]: {
        flex: '1 1 0',
        width: '100%',
        minHeight: 0,
      },
    },
  }
}

export default genStyleHooks('ImContact', genImContactStyle)

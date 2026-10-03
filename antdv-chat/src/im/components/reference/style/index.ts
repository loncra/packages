import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 引用条的默认样式。
 *
 * 原宿主那几处 Tailwind（`ChatMessageReference.vue:34/38/39/51`）落成静态值：
 * - 根 `cursor-pointer inline-flex max-w-80 items-center` ⇒ `max-w-80` = 20rem = **320px**；
 * - 身体 `min-w-0 max-w-full flex-1 items-center`；作者 `shrink-0`；内容 `min-w-0 flex-1`。
 */
function genImMessageReferenceStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      cursor: 'pointer',
      /**
       * ⚠️ **两个 `!important` 必须有**：`Tag` 自带 `.ant-tag { display: inline-block }`
       * （与我们的选择器**同特异性**，且它**后注册** ⇒ 它赢）⇒ 里面那个 `Flex`（块级 flex）
       * 会把 `closable` 的**关闭叉挤到下一行**（2026-10-03 用户报障："关闭的 X 换行了"）。
       * `inline-flex` 让叉与文字回到同一行（宿主 Tailwind 的 `inline-flex` 就是干这个的）。
       */
      display: 'inline-flex !important',
      alignItems: 'center !important',
      maxWidth: 320,
    },
    [`${componentCls}-body`]: {
      minWidth: 0,
      maxWidth: '100%',
      flex: '1 1 0',
      // 宿主 `overflow-hidden`（原先漏了：内容长到顶时会把关闭叉顶出可视区）
      overflow: 'hidden',
    },
    [`${componentCls}-author`]: {
      flex: '0 0 auto',
    },
    [`${componentCls}-content`]: {
      minWidth: 0,
      flex: '1 1 0',
    },
  }
}

export default genStyleHooks('ImMessageReference', genImMessageReferenceStyle)

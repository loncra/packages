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
      display: 'inline-flex',
      maxWidth: 320,
      alignItems: 'center',
    },
    [`${componentCls}-body`]: {
      minWidth: 0,
      maxWidth: '100%',
      flex: '1 1 0',
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

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const { componentCls } = token
  return {
    [componentCls]: {
      [`&-scroll`]: {
        overflow: 'auto',
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Markdown', genMarkdownStyle)

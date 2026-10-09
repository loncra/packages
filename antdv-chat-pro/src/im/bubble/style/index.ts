import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const IM_BUBBLE_PREFIX = 'loncra-im-bubble'

function genImBubbleStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, marginXS} = token
  return {
    [componentCls]: {
      [`${componentCls}-footer`]: {
        display: 'flex',
        gap: marginXS,
      },
      [`${componentCls}-read`]: {
        display: 'flex',
        alignItems: 'center',
      },
      [`&${componentCls}-read-table`]: {
        width: '25rem',
        maxWidth: '25rem',
        minWidth: 0,
        [`${antCls}-table-wrapper`]: {
          width: '100%',
          maxWidth: '100%',
        },
      },
      [`${componentCls}-reference`]: {
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '20rem',
      },
      [`${componentCls}-reference-body`]: {
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden',
      },
      [`${componentCls}-reference-name`]: {
        flexShrink: 0,
      },
      [`${componentCls}-reference-preview`]: {
        minWidth: 0,
        flex: 1,
      },
    },
  }
}

export default genStyleHooks('ImBubble', genImBubbleStyle, {order: 1})

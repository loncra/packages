import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'
import {genDragGhostStyle, genDragRowStyle} from '../../_util/style/fragments'

function genQueryCardGridStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorInfoBg} = token

  return [
    {
      [componentCls]: {
        [`${antCls}-card-body`]: {
          padding: 0,
          marginBlockStart: -1,
          marginInlineStart: -1,
        },
        [`${componentCls}-grid`]: {
          display: 'flex',
          flexWrap: 'wrap',
          [`&${componentCls}-grid-empty`]: {
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 160,
          },
        },
        [`${antCls}-card-grid${componentCls}-item`]: {
          width: 'calc(100% / var(--loncra-card-grid-columns, 5))',
        },
        [`${antCls}-card-grid${componentCls}-item-selected`]: {
          backgroundColor: colorInfoBg,
        },
        ...genDragRowStyle(token, componentCls),
      },
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryCardGrid', genQueryCardGridStyle, {order: 2})

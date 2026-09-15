import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'
import {genDragGhostStyle, genDragStyle} from '../../_util/crud/genDragStyle'

function genQueryCardGridStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorInfoBg, margin, paddingXS} = token

  return [
    {
      [componentCls]: {
        '.icon': {verticalAlign: 'middle'},
        '.icon.align': {marginBottom: '3px'},
        [`${componentCls}-title`]: {paddingInline: paddingXS},
        [`${antCls}-card-grid${componentCls}-item`]: {
          width: 'calc(100% / var(--loncra-card-grid-columns, 5))',
        },
        [`${antCls}-card-grid${componentCls}-item-selected`]: {
          backgroundColor: colorInfoBg,
        },
        [`${componentCls}-pagination`]: {marginTop: margin},
        ...genDragStyle(token, componentCls),
      },
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryCardGrid', genQueryCardGridStyle)

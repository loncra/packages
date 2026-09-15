import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'
import {genDragGhostStyle, genDragStyle} from '../../_util/crud/genDragStyle'

function genQueryTableStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorPrimary, padding, paddingXS} = token

  return [
    {
      [componentCls]: {
        '.icon': {verticalAlign: 'middle'},
        '.icon.align': {marginBottom: '3px'},
        [`${antCls}-table-content`]: {borderRadius: 0},
        [`${componentCls}-title`]: {paddingInline: paddingXS},
        [`${componentCls}-title ${antCls}-typography`]: {marginBottom: 0},
        [`${componentCls}-filter-icon-active`]: {color: colorPrimary},
        ...genDragStyle(token, componentCls),
      },
    },
    {
      [`${componentCls}-filter-dropdown`]: {padding},
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryTable', genQueryTableStyle)

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'
import {genDragGhostStyle, genDragRowStyle} from '../../_util/style/fragments'

function genQueryTableStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorPrimary, padding, paddingXS} = token

  return [
    {
      [componentCls]: {
        [`${antCls}-table-content`]: {borderRadius: 0},
        [`${componentCls}-table-title`]: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: paddingXS,
          [`${antCls}-typography`]: {marginBottom: 0},
        },
        [`${componentCls}-filter-icon-active`]: {color: colorPrimary},
        ...genDragRowStyle(token, componentCls),
      },
    },
    {
      [`${componentCls}-filter-dropdown`]: {padding},
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryTable', genQueryTableStyle, {order: 2})

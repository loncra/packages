import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'
import {genEmptyAreaStyle} from '../../../_util/style/fragments'

function genImContactStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      [`${componentCls}-empty`]: genEmptyAreaStyle(),
    },
  }
}

export default genStyleHooks('ImContact', genImContactStyle, {order: 4})

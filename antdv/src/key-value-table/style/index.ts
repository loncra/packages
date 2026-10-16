import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genKeyValueTableStyle(token: LoncraStyleToken): CSSInterpolation {
  const { componentCls, antCls } = token
  return {
    [componentCls]: {
      [`${componentCls}-value`]: {
        width: '100%',
      },
      [`${antCls}-select`]: {
        width: '100%',
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('KeyValueTable', genKeyValueTableStyle, {order: 1})

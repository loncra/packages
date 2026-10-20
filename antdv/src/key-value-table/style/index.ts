import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '../../_util/genStyleLayer'

function genKeyValueTableStyle(token: LoncraStyleToken): CSSInterpolation {
  const { componentCls } = token
  return {
    [componentCls]: {
      [`${componentCls}-value-select`]: {
        width: '100%',
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('KeyValueTable', genKeyValueTableStyle, {order: 1})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoneraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genKeyValueTableStyle(token: LoneraStyleToken): CSSInterpolation {
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

export default genStyleHooks('KeyValueTable', genKeyValueTableStyle)

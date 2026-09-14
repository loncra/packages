import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

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
      ['.icon']: {
        verticalAlign: 'middle',
      },
      ['.icon.align']: {
        marginBottom: 3,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('KeyValueTable', genKeyValueTableStyle)

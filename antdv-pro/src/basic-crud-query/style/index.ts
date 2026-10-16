import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genBasicCrudQueryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, margin} = token

  return [
    {
      [`${componentCls}-pagination`]: {marginTop: `${margin} !important`},
    },
  ]
}

export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle, {order: 2})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genBasicCrudQueryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, margin} = token

  return [
    {
      [`${componentCls}-pagination`]: {marginTop: margin},
    },
  ]
}

export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle, {order: 2})

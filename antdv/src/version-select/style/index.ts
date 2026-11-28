import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '../../_util/genStyleLayer'

function genVersionSelectStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token

  return {
    [componentCls]: {
      '&-select': {
        width: 'auto',
      },
    },
  }
}

export default genStyleHooks('VersionSelect', genVersionSelectStyle, {order: 1})

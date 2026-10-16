import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorError} = token
  return {
    [componentCls]: {
      [`${antCls}-app`]: {
        minHeight: 0,
        background: 'transparent',
      },
      [`&-status-error .editor`]: {
        borderColor: `${colorError} !important`,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Editor', genEditorStyle, {order: 1})

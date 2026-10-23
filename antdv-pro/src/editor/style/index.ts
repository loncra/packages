import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '../../_util/genStyleLayer'

function genEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorError} = token
  return {
    [componentCls]: {
      [`${antCls}-app`]: {
        minHeight: 0,
        background: 'transparent',
      },
      [`&-status-error .editor, &-status-error .editor .editor-toolbar, &-status-error .editor .editor-word-count`]: {
        borderColor: `${colorError} !important`,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Editor', genEditorStyle, {order: 1})

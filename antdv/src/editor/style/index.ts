import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoneraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genEditorStyle(token: LoneraStyleToken): CSSInterpolation {
  const { componentCls } = token
  return {
    [componentCls]: {
      [`&-status-error`]: {
        outline: `1px solid ${String(token.colorError ?? '#ff4d4f')}`,
        outlineOffset: 0,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Editor', genEditorStyle)

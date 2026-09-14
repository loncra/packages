import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const { componentCls, antCls } = token
  return {
    [componentCls]: {
      // AEditor 根上又包了一层 App；官方 .ant-app 默认 min-height:100vh，嵌套时会撑出整屏空白。
      [`${antCls}-app`]: {
        minHeight: 0,
        background: 'transparent',
      },
      [`&-status-error`]: {
        outline: `1px solid ${String(token.colorError ?? '#ff4d4f')}`,
        outlineOffset: 0,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Editor', genEditorStyle)

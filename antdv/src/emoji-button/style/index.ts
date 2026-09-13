import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoneraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genEmojiButtonStyle(token: LoneraStyleToken): CSSInterpolation {
  const { componentCls } = token
  const controlHeightLG = Number(token.controlHeightLG ?? 40)
  const fontSizeXL = Number(token.fontSizeXL ?? 20)
  const paddingXXS = Number(token.paddingXXS ?? 4)

  return {
    [componentCls]: {
      [`&-panel`]: {
        width: controlHeightLG * 10,
      },
      [`${componentCls}-body`]: {
        overflow: 'auto',
        maxHeight: controlHeightLG * 8,
      },
      [`${componentCls}-cell`]: {
        cursor: 'pointer',
        paddingBlock: paddingXXS,
        paddingInline: 0,
        width: `${100 / 11}%`,
        textAlign: 'center',
      },
      [`${componentCls}-emoji`]: {
        display: 'block',
        width: '100%',
        fontSize: fontSizeXL,
        lineHeight: 1,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('EmojiButton', genEmojiButtonStyle)

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genEmojiButtonStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, controlHeightLG, fontSizeXL, paddingXS, calc} = token

  return {
    [componentCls]: {
      [`&-panel`]: {
        width: calc(controlHeightLG).mul(10).equal(),
      },
      [`${componentCls}-body`]: {
        overflow: 'auto',
        maxHeight: calc(controlHeightLG).mul(8).equal(),
      },
      [`${componentCls}-cell`]: {
        cursor: 'pointer',
        paddingBlock: paddingXS,
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
  }
}

export default genStyleHooks('EmojiButton', genEmojiButtonStyle)

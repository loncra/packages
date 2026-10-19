import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genScrollAreaStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genEmojiButtonStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, controlHeightLG, fontSizeXL, paddingXS, calc} = token

  return {
    [componentCls]: {
      [`&-panel`]: {
        width: calc(controlHeightLG).mul(10).equal(),
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
    ...genScrollAreaStyle(token, '-body', 8),
  }
}

export default genStyleHooks('EmojiButton', genEmojiButtonStyle, {order: 3})

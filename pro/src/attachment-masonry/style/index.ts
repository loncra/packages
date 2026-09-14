import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {type LoncraStyleToken, genStyleHooks} from '@loncra/antdv'

function genAttachmentMasonryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorFillTertiary} = token
  return {
    [`${componentCls}-cover`]: {
      width: '100%',
    },
    [`${componentCls}-placeholder`]: {
      aspectRatio: '4 / 3',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colorFillTertiary,
    },
    [`${componentCls}-file-icon`]: {
      fontSize: token.fontSizeHeading3,
    },
  }
}

export default genStyleHooks('AttachmentMasonry', genAttachmentMasonryStyle)

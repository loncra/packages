import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genAttachmentMasonryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorFillTertiary, fontSizeHeading2} = token
  return {
    [componentCls]: {
      [`${componentCls}-cover`]: {
        width: '100%',
      },
      [`${antCls}-card-cover > ${componentCls}-placeholder`]: {
        aspectRatio: '4 / 3',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colorFillTertiary,
      },
      [`${componentCls}-file-icon`]: {
        fontSize: fontSizeHeading2,
      },
    },
  }
}

export default genStyleHooks('AttachmentMasonry', genAttachmentMasonryStyle, {order: 2})

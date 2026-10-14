import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'

export default function genFilePanesStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls, colorBgLayout, paddingXS} = token
  return {
    [`${componentCls}-media`]: {
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: paddingXS,
    },
    [`${componentCls}-media-img, ${componentCls}-media-video`]: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    [`${componentCls}-media-video`]: {
      background: colorBgLayout,
    },
  }
}

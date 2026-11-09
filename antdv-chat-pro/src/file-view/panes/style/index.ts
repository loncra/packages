import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'
import {genFilePaneChromeStyle} from '../../../_util/style/fragments'

function genFilePaneStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls, colorBgLayout, paddingXS} = token
  return {
    ...genFilePaneChromeStyle(token),
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
    [`${componentCls}-media-audio`]: {
      width: '100%',
      maxWidth: '36rem',
    },
  }
}

export default genStyleHooks('FilePane', genFilePaneStyle, {order: 4})

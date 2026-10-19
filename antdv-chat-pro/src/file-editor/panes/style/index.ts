import type {CSSObject} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genFilePaneStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls, colorBgLayout, paddingXS} = token
  return {
    [`${componentCls}-pane`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
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
    [`${componentCls}-editor`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('FilePane', genFilePaneStyle, {order: 4})

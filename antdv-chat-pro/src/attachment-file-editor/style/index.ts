import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'
import {genFilePaneChromeStyle} from '../../_util/style/fragments'

function genAttachmentFileEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      minHeight: 0,
    },
    [`${componentCls}-hidden-upload`]: {
      display: 'none',
    },
    [`${componentCls}-view`]: {
      flex: 'auto',
      minWidth: 0,
      minHeight: 0,
      width: '100%',
    },
    ...genFilePaneChromeStyle(token),
  }
}

export default genStyleHooks('AttachmentFileEditor', genAttachmentFileEditorStyle, {order: 4})

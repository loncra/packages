import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genAttachmentFileEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [`${componentCls}-hidden-upload`]: {
      display: 'none',
    },
  }
}

export default genStyleHooks('AttachmentFileEditor', genAttachmentFileEditorStyle, {order: 4})

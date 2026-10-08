import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

function genSenderSlotBubbleContentStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    },
  }
}

export default genStyleHooks('SenderSlotBubbleContent', genSenderSlotBubbleContentStyle)

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genSenderSlotBubbleContentStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token
  return {
    [componentCls]: {
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    },
  }
}

export default genStyleHooks('SenderSlotBubbleContent', genSenderSlotBubbleContentStyle, {order: 4})

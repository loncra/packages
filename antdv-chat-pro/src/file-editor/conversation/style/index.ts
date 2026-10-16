import type {CSSObject} from '@antdv-next/cssinjs'
import {GLOBAL_SPIN_KEYFRAMES} from '@loncra/antdv'
import type {LoncraStyleToken} from '../../../_util/genStyleLayer'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genFileConversationStyle(token: LoncraStyleToken): CSSObject {
  const {
    componentCls,
    colorBorderSecondary,
    lineWidth,
    lineType,
    paddingXS,
    motionDurationSlow,
  } = token

  return {
    [`${componentCls}-side`]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-toolbar`]: {
      width: '100%',
      flexShrink: 0,
      padding: paddingXS,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-icon-spin`]: {
      marginBottom: 3,
      animationName: GLOBAL_SPIN_KEYFRAMES,
      animationDuration: motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  }
}

export default genStyleHooks('FileConversation', genFileConversationStyle, {order: 4})

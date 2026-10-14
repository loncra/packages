import type {CSSObject} from '@antdv-next/cssinjs'
import {GLOBAL_SPIN_KEYFRAMES, genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

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
      // 给 `Keyframes` **实例**（不是字符串）：cssinjs 会换成 `getName(hashId)`（带 hashId，不撞车）
      animationName: GLOBAL_SPIN_KEYFRAMES,
      animationDuration: motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  }
}

export default genStyleHooks('FileConversation', genFileConversationStyle, {order: 1})

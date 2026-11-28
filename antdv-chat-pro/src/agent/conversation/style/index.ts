import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {type LoncraStyleToken, SPIN_KEYFRAMES} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'
import {genToneColorStyle} from '../../../_util/style/fragments'

export const AGENT_CONVERSATION_PREFIX = 'loncra-agent-conversation'

function genAgentConversationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorPrimary, padding, antCls} = token
  return {
    [componentCls]: {
      [`${componentCls}-header`]: {
        padding,
      },
      [`${antCls}-divider`]: {
        marginTop: 0
      },
      ...genToneColorStyle(token),
      [`${componentCls}-running`]: {
        color: colorPrimary,
        animationName: SPIN_KEYFRAMES,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      },
      [`${componentCls}-name`]: {
        flex: 1,
        minWidth: 0,
        marginInlineStart:0
      },
      [`${componentCls}-workspace-label`]: {
        minWidth: 0,
        [`${antCls}-icon`]: {
          flexShrink: 0,
        },
      },
    },
    [`${componentCls}-divider-flush`]: {
      margin: 0,
    },
  }
}

export default genStyleHooks('AgentConversation', genAgentConversationStyle, {order: 4})

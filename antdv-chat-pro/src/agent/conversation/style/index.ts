import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {GLOBAL_SPIN_KEYFRAMES} from '@loncra/antdv'
import type {LoncraStyleToken} from '../../../_util/genStyleLayer'
import {genStyleHooks} from '../../../_util/genStyleLayer'

export const AGENT_CONVERSATION_PREFIX = 'loncra-agent-conversation'

function genAgentConversationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorPrimary, colorSuccess, colorWarning, colorError, colorTextSecondary, padding, antCls} = token
  return {
    [componentCls]: {
      [`${componentCls}-header`]: {
        padding,
      },
      [`${antCls}-divider`]: {
        marginTop: 0
      },
      [`${componentCls}-primary`]: {color: colorPrimary},
      [`${componentCls}-success`]: {color: colorSuccess},
      [`${componentCls}-warning`]: {color: colorWarning},
      [`${componentCls}-error`]: {color: colorError},
      [`${componentCls}-secondary`]: {color: colorTextSecondary},
      [`${componentCls}-running`]: {
        color: colorPrimary,
        animationName: GLOBAL_SPIN_KEYFRAMES,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'linear',
      },
    },
  }
}

export default genStyleHooks('AgentConversation', genAgentConversationStyle, {order: 4})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {GLOBAL_SPIN_KEYFRAMES, genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

export const AGENT_CONVERSATION_PREFIX = 'loncra-agent-conversation'

function genAgentConversationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorPrimary, colorSuccess, colorWarning, colorError, colorTextSecondary, padding, antCls} = token
  return {
    [componentCls]: {
      [`${componentCls}-header`]: {
        padding,
      },
      [`${antCls}-divider`]: {
        marginTop:`0 !important`
      },
      [`${componentCls}-primary`]: {color: `${colorPrimary} !important`},
      [`${componentCls}-success`]: {color: `${colorSuccess} !important`},
      [`${componentCls}-warning`]: {color: `${colorWarning} !important`},
      [`${componentCls}-error`]: {color: `${colorError} !important`},
      [`${componentCls}-secondary`]: {color: `${colorTextSecondary} !important`},
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

export default genStyleHooks('AgentConversation', genAgentConversationStyle, {order: 1})

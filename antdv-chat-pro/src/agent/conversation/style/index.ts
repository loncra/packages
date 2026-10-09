import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {Keyframes} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const AGENT_CONVERSATION_PREFIX = 'loncra-agent-conversation'

const runningSpin = new Keyframes('loncraAgentConversationSpin', {
  to: {transform: 'rotate(360deg)'},
})

function genAgentConversationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorPrimary, colorSuccess, colorWarning, colorError, colorTextSecondary, padding} = token
  return [
    runningSpin,
    {
      [componentCls]: {
        [`${componentCls}-header`]: {
          padding,
        },
        [`${componentCls}-primary`]: {color: colorPrimary},
        [`${componentCls}-success`]: {color: colorSuccess},
        [`${componentCls}-warning`]: {color: colorWarning},
        [`${componentCls}-error`]: {color: colorError},
        [`${componentCls}-secondary`]: {color: colorTextSecondary},
        [`${componentCls}-running`]: {
          color: colorPrimary,
          animationName: runningSpin,
          animationDuration: '1s',
          animationIterationCount: 'infinite',
          animationTimingFunction: 'linear',
        },
      },
    },
  ]
}

export default genStyleHooks('AgentConversation', genAgentConversationStyle, {order: 1})

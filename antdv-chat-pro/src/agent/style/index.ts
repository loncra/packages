import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const AGENT_CHAT_PREFIX = 'loncra-agent-chat'

function genAgentChatStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, colorBorderSecondary} = token
  return {
    [componentCls]: {
      height: '100%',
      minHeight: 0,
      [`${componentCls}-side`]: {
        height: '100%',
        minHeight: 0,
        padding: '0 !important',
        overflow: 'hidden',
      },
      [`${componentCls}-main`]: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      },
      [`${componentCls}-column`]: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      },
      [`${componentCls}-stage`]: {
        position: 'relative',
        flex: '1 1 0',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      },
      [`${componentCls}-welcome`]: {
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-welcome-icon`]: {
        fontSize: '3rem',
        lineHeight: 1,
      },
      [`${componentCls}-footer`]: {
        flexShrink: 0,
        padding: paddingSM,
        borderTop: `1px solid ${colorBorderSecondary}`,
      },
    },
  }
}

export default genStyleHooks('AgentChat', genAgentChatStyle, {order: 1})

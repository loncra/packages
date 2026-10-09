import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const AGENT_BUBBLE_PREFIX = 'loncra-agent-bubble'

function genAgentBubbleStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    antCls,
    marginXS,
    paddingXS,
    paddingSM,
    fontSizeSM,
    motionDurationSlow,
    colorTextQuaternary,
  } = token
  return {
    [componentCls]: {
      [`${componentCls}-footer`]: {
        display: 'flex',
        gap: marginXS,
      },
      [`${componentCls}-think`]: {
        [`${antCls}-card-body`]: {
          padding: paddingXS,
        },
      },
      [`${componentCls}-tool`]: {
        [`${antCls}-card-body`]: {
          padding: 0,
        },
      },
      [`${componentCls}-tool-toggle`]: {
        cursor: 'pointer',
      },
      [`${componentCls}-tool-arrow`]: {
        fontSize: fontSizeSM,
        color: colorTextQuaternary,
        transition: `transform ${motionDurationSlow}`,
      },
      [`${componentCls}-tool-arrow-open`]: {
        transform: 'rotate(90deg)',
      },
      [`${componentCls}-tool-body`]: {
        padding: paddingSM,
      },
      [`${componentCls}-scroll`]: {
        maxHeight: '30vh',
        overflow: 'auto',
      },
      [`${componentCls}-scroll-tall`]: {
        maxHeight: '40vh',
        overflow: 'auto',
      },
    },
  }
}

export default genStyleHooks('AgentBubble', genAgentBubbleStyle, {order: 1})

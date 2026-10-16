import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../../_util/genStyleLayer'
import {genStyleHooks} from '../../../_util/genStyleLayer'

export const AGENT_BUBBLE_PREFIX = 'loncra-agent-bubble'

function genAgentBubbleStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    antCls,
    marginXS,
    paddingXS,
    paddingSM,
    lineWidth,
    lineType,
    colorTextSecondary,
    colorBorderSecondary,
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
        [`${antCls}-card-head`]: {
          borderBottom: 'none',
          padding:paddingXS,
          fontWeight: 'normal',
          color: colorTextSecondary
        },
        [`${antCls}-card-body`]: {
          padding: 0,
        },
      },
      [`${componentCls}-answer`]: {
        paddingBlock: 0,
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
        borderTop: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
        padding: paddingSM,
        [`${antCls}-thought-chain ${antCls}-thought-chain-node-description`]: {
          marginBlockEnd:0
        }
      },
    },
  }
}

export default genStyleHooks('AgentBubble', genAgentBubbleStyle, {order: 4})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
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
    colorTextTertiary,
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
        [`.antd-think-status-wrapper .antd-think-status-down-icon`]: {
          fontSize: fontSizeSM,
          color: colorTextQuaternary,
        },
        [`.antd-think-content .x-markdown ol li::marker, .antd-think-content .x-markdown ul li::marker, .antd-think-content .x-markdown *`]: {
          color: `${colorTextTertiary} !important`,
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
        paddingInlineEnd:0
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
        },
        [`.antd-thought-chain-node-box`]: {
          minWidth: 0,
        },
      },
    },
  }
}

export default genStyleHooks('AgentBubble', genAgentBubbleStyle, {order: 4})

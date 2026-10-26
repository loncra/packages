import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genScrollAreaStyle, type LoncraStyleToken} from '@loncra/antdv'
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
    calc,
    sizeXL,
    sizeXXL,
  } = token
  return {
    [`${componentCls}-token-list`]: {
        maxHeight: calc(sizeXXL).mul(5).equal(),
        maxWidth: calc(sizeXXL).mul(10).equal(),
        minWidth: calc(sizeXL).mul(10).equal(),
        padding: paddingXS,
        overflow: 'auto',
    },
    [`${componentCls}-divider-flush`]: {
        margin: 0,
    },
    ...genScrollAreaStyle(token, '-extract-content', 8, 12),
    [componentCls]: {
      ...genScrollAreaStyle(token, '-scroll-tall', 12),
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
        ...genScrollAreaStyle(token, '-markdown', 5),
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

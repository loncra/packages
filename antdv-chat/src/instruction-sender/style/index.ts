import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genScrollAreaStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genInstructionSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    paddingXS,
    lineWidth,
    lineType,
    colorBorderSecondary,
    colorPrimaryBg,
    colorFillSecondary,
    borderRadiusSM,
  } = token
  return {
    [componentCls]: {
      [`${componentCls}-footer`]: {
        padding: paddingXS,
        borderTop: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
      },
    },
    [`${componentCls}-input`]: {
      whiteSpace: 'pre-wrap',
      [`> .antd-sender-slot:not(.antd-sender-slot-content)`]: {
        height: 'auto !important',
        verticalAlign: 'bottom !important',
        marginBlock: 0,
      },
      [`&[contenteditable="false"]`]: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    ...genScrollAreaStyle(token, '-panel', 6, 6),
    [`${componentCls}-item`]: {
      padding: paddingXS,
      cursor: 'pointer',
      borderRadius: borderRadiusSM,
      [`&:not(${componentCls}-item-active):hover`]: {
        backgroundColor: colorFillSecondary,
      },
    },
    [`${componentCls}-item-active`]: {
      backgroundColor: colorPrimaryBg,
    },
    [`${componentCls}-anchor`]: {
      position: 'fixed',
      width: 1,
      height: '1em',
      pointerEvents: 'none',
    },
  }
}

export default genStyleHooks('InstructionSender', genInstructionSenderStyle, {order: 3})

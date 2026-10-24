import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genInstructionSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    antCls,
    paddingXS,
    lineWidth,
    lineType,
    colorBorderSecondary,
    colorPrimaryBg,
    colorFillSecondary,
    borderRadiusSM,
    controlHeightLG,
    calc,
  } = token
  const panelSize = calc(controlHeightLG).mul(6).equal()

  return {
    [componentCls]: {
      [`${componentCls}-footer`]: {
        padding: paddingXS,
        borderTop: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
      },
    },
    [`${componentCls}-input`]: {
      [`> ${antCls}-sender-slot:not(${antCls}-sender-slot-content)`]: {
        height: 'auto',
        verticalAlign: 'bottom',
        marginBlock: 0,
      },
      [`&[contenteditable="false"]`]: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
    [`${componentCls}-panel`]: {
      maxHeight: panelSize,
      maxWidth: panelSize,
      overflow: 'auto',
    },
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

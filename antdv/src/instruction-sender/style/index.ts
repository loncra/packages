import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

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
    controlHeightLG,
    calc,
  } = token
  const panelSize = calc(controlHeightLG).mul(6).equal()

  return {
    [componentCls]: {
      [`${componentCls}-footer`]: {
        padding: `${unit(paddingXS)} !important`,
        borderTop: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
      },
      [`.antd-sender-input.antd-sender-input-slot`]: {
        [`> .antd-sender-slot:not(.antd-sender-slot-content)`]: {
          height: 'auto !important',
          verticalAlign: 'bottom',
          marginBlock: '0 !important',
        },
        [`&[contenteditable="false"]`]: {
          opacity: 0.5,
          cursor: 'not-allowed !important',
        },
      },
    },
    [`${componentCls}-footer`]: {
      padding: `${unit(paddingXS)} !important`,
      borderTop: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
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

export default genStyleHooks('InstructionSender', genInstructionSenderStyle, {order: 0})

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
      [`&-footer`]: {
        padding: `${unit(paddingXS)} !important`,
        borderTop: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
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

export default genStyleHooks('InstructionSender', genInstructionSenderStyle)

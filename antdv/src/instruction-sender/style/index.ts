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
    /**
     * ⚠️ 这里原来是靠 `!important` 硬顶 antd 的（`order` 传 `0` = falsy ⇒ 与 antd 同队列 ⇒
     * 同特异性时 antd 后写赢，来龙去脉见 `@loncra/antdv` 的 `icon-select/style/index.ts` 那段说明）。
     * 顺序已改成 `{order: 1}`（排在 antd 之后注入）⇒ **同特异性的冲突自然赢，`!important` 全撤**。
     */
    [componentCls]: {
      [`${componentCls}-footer`]: {
        padding: unit(paddingXS),
        borderTop: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
      },
      [`.antd-sender-input.antd-sender-input-slot`]: {
        [`> .antd-sender-slot:not(.antd-sender-slot-content)`]: {
          height: 'auto',
          verticalAlign: 'bottom',
          marginBlock: '0',
        },
        [`&[contenteditable="false"]`]: {
          opacity: 0.5,
          cursor: 'not-allowed',
        },
      },
    },
    [`${componentCls}-footer`]: {
      padding: unit(paddingXS),
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

/** `order` 传正数：本组件的规则排在 antd 之后注入 ⇒ 同特异性的冲突自然赢（理由同 `icon-select`） */
export default genStyleHooks('InstructionSender', genInstructionSenderStyle, {order: 1})

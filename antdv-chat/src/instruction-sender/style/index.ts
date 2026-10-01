import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

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
     * ⚠️ 下面这几条 **必须 `!important`**（2026-09-30 恢复）：它们与 antd `Sender` 自己的样式
     * **同特异性打平**，而本仓样式整体住在 `@layer antd` ⇒ cssinjs 把 `prepend` 从 'queue' 关成
     * `false` ⇒ **`order` 不参与插入排序**（`useStyleRegister.js` / `dynamicCSS.js`），打平一律
     * "后注册的赢" ⇒ antd（子组件、后注册）永远压过我们 ⇒ `!important` 是唯一稳定手段
     * （`order: 1` 不是保障；详见 `basic-crud-query/style/index.ts` 的说明）。
     */
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

/** `order` 传正数：本组件的规则排在 antd 之后注入 ⇒ 同特异性的冲突自然赢（理由同 `icon-select`） */
export default genStyleHooks('InstructionSender', genInstructionSenderStyle, {order: 1})

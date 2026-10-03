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
        /**
         * ⚠️ 三个值**都必须 `!important`** —— 对应宿主 `.chat-sender-input` 那条 Tailwind
         * `@apply h-auto! align-bottom! my-0!`（**每个值都带 `!`**）。
         * 2026-10-03 移植时漏了 `vertical-align` 的 `!` ⇒ x 自己的对齐压过来 ⇒
         * **粘贴附件后光标跑到下一行**（用户报障的真根因）。同一条规则对"附件槽高度/外边距"也一样。
         */
        [`> .antd-sender-slot:not(.antd-sender-slot-content)`]: {
          height: 'auto !important',
          verticalAlign: 'bottom !important',
          marginBlock: '0 !important',
          /**
           * ⚠️ **芯片根节点必须回到"行内块"，否则必然断行。**
           *
           * 芯片内部是 pro 的 `.loncra-attachment-upload-list-cards { display: flex }`
           * 与 `-list { width: 100% }` ⇒ 芯片根一渲染就是**块级 + 撑满整行**，
           * 而它外面只是个行内 `<span class="antd-sender-slot">` ⇒ 浏览器只能把它**单独放到一行**，
           * 后面的文字/光标被挤到下一行（2026-10-03 用户报障："输入 → 粘贴 → 光标换行"，
           * **一个文件也复现** —— 正是"块级 + 100%"的特征）。
           *
           * `> *` 就是芯片根节点（`h(AttachmentUpload, …)` 的根 div）。`inline-block` 让宽度**收缩到内容**，
           * 附件于是与前后文字同处一行。作用域只在这个槽里 ⇒ **完全不影响气泡里的同一组件**。
           */
          ['> *']: {
            display: 'inline-block !important',
          },
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

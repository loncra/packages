import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorError} = token
  return {
    [componentCls]: {
      // AEditor 根上又包了一层 App；官方 .ant-app 默认 min-height:100vh，嵌套时会撑出整屏空白。
      [`${antCls}-app`]: {
        minHeight: 0,
        background: 'transparent',
      },
      /**
       * 校验错误时把内容区边框染成错误色。
       *
       * ⚠️ 两处都不能省（2026-09-30 用户实测"没生效"）：
       * ① **`.editor` 的点不能漏** —— 内容区那个 `<div class="editor">` 是 **tiptap 包自己的 DOM**
       *    （`antdv-next-tiptap/dist/index.mjs` 的 `hs = {class: "editor"}`）。原来写成 `editor`
       *    （**元素选择器** `<editor>`）⇒ 与任何元素都不匹配 ⇒ 规则永不命中；
       * ② **必须 `!important`** —— 那条带 `border: 1px solid var(--ant-color-border-secondary)` 的
       *    `.editor{…}` 规则来自 `antdv-next-tiptap/index.css`（UnoCSS 产物，**没有 `@layer`**），
       *    而本仓样式住在 `@layer antd`。**未分层的普通声明优先于任何分层里的普通声明**
       *    （级联层级规则：「不在层里 = 排在最后 = 普通声明里最强」）⇒ 比特异性没用、`order` 也没用
       *    ⇒ 只能 `!important`（重要声明的层序是反的：分层里的 important 反而更强）。
       */
      [`&-status-error .editor`]: {
        borderColor: `${colorError} !important`,
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Editor', genEditorStyle)

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXXS, paddingXS} = token
  return {
    /**
     * ⚠️ 下面那两组 `!important` **保留**：`order` 传正数只解决"我们与 antd **同队列、同特异性**时的
     * 先后"（见 `icon-select/style/index.ts` 那段说明，它只把 `instruction-sender` 那几处归因于此）；
     * 这里要压的是**代码高亮器自己的 `pre` / `code` 规则**（`@antdv-next/x-markdown` 的主题 CSS 那一路），
     * 不在同一个注入队列里 ⇒ 顺序修好也替不掉它们（要摘得先取证，另开一轮）。
     */
    [`${componentCls}-scroll`]: {
      overflow: 'auto',
    },
    [`${componentCls} .x-markdown .antd-code-highlighter .antd-code-highlighter-content .antd-code-highlighter-code pre`]:
      {
        padding: `${unit(paddingXXS)} !important`,
      },
    [`${componentCls} .x-markdown .antd-code-highlighter .antd-code-highlighter-content .antd-code-highlighter-code pre code`]:
      {
        ['white-space']: 'pre !important',
        ['word-break']: 'normal !important',
        lineHeight: '1.5em !important',
        background: 'transparent !important',
        margin: '0 !important',
        padding: `${unit(paddingXS)} !important`,
        borderRadius: 0,
        border: '0 !important',
      },
  }
}

/** `order` 传正数：本组件的规则排在 antd 之后注入 ⇒ 同特异性的冲突自然赢（理由同 `icon-select`） */
export default genStyleHooks('Markdown', genMarkdownStyle, {order: 1})

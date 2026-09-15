import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXXS, paddingXS} = token
  return {
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

export default genStyleHooks('Markdown', genMarkdownStyle, {order: 0})

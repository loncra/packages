import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXXS, paddingXS} = token
  return {
    [componentCls]: {
      [`&-scroll`]: {
        overflow: 'auto',
      },
      [`.x-markdown .antd-code-highlighter .antd-code-highlighter-content .antd-code-highlighter-code pre`]:
        {
          padding: `${unit(paddingXXS)} !important`,
        },
      [`.x-markdown .antd-code-highlighter .antd-code-highlighter-content .antd-code-highlighter-code pre code`]:
        {
          whiteSpace: 'pre !important',
          wordBreak: 'normal !important',
          lineHeight: '1.5em !important',
          background: 'transparent !important',
          margin: '0 !important',
          padding: `${unit(paddingXS)} !important`,
          borderRadius: 0,
          border: '0 !important',
        },
    },
  } as CSSInterpolation
}

export default genStyleHooks('Markdown', genMarkdownStyle, {order: 0})

import {unit, type CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, paddingXXS, paddingXS} = token
  return {
    [`${componentCls} .x-markdown ${antCls}-code-highlighter ${antCls}-code-highlighter-content ${antCls}-code-highlighter-code pre`]:
      {
        padding: `${unit(paddingXXS)} !important`,
      },
    [`${componentCls} .x-markdown ${antCls}-code-highlighter ${antCls}-code-highlighter-content ${antCls}-code-highlighter-code pre code`]:
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
  } as CSSInterpolation
}

export default genStyleHooks('Markdown', genMarkdownStyle, {order: 3})

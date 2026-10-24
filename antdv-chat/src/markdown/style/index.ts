import {unit, type CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genMarkdownStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, paddingXXS, paddingXS} = token
  return {
    /*[`${componentCls}-scroll`]: {
      overflow: 'auto',
    },*/
    [`${componentCls} .x-markdown ${antCls}-code-highlighter ${antCls}-code-highlighter-content ${antCls}-code-highlighter-code pre`]:
      {
        padding: `${unit(paddingXXS)}`,
      },
    [`${componentCls} .x-markdown ${antCls}-code-highlighter ${antCls}-code-highlighter-content ${antCls}-code-highlighter-code pre code`]:
      {
        whiteSpace: 'pre',
        wordBreak: 'normal',
        lineHeight: '1.5em',
        background: 'transparent',
        margin: '0',
        padding: `${unit(paddingXS)}`,
        borderRadius: 0,
        border: '0',
      },
  } as CSSInterpolation
}

export default genStyleHooks('Markdown', genMarkdownStyle, {order: 3})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genBasicCrudQueryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, margin} = token

  return [
    {
      // 统一分页由基类渲染；分页元素自己带 componentCls + hashId（不在某个形态的组件根下），
      // 所以选择器写在顶层（同 `-drag-ghost` 的写法）
      [`${componentCls}-pagination`]: {marginTop: margin},
    },
  ]
}

export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle)

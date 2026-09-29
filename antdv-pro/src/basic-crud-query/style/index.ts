import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genBasicCrudQueryStyle(token: LoncraStyleToken): CSSInterpolation {
  /**
   * ⚠️ token 里的 `componentCls` / `antCls` **各自已经带前导点**：`componentCls` = `.loncra-xxx`、
   * `antCls` = `.ant`（**没有**尾横杠）。所以拼接一律写 `${antCls}-card-body`（→ `.ant-card-body`），
   * **不要**再补一个字面量点：多一个点会拼出非法的 `..ant-card-body` —— **规则照样出现在样式表里，
   * 但永不匹配**（2026-09-23 踩过，排查了半天；改完务必去 DevTools 看生成的选择器文本）。
   */
  const {componentCls, margin} = token

  return [
    {
      // 统一分页由基类渲染；分页元素自己带 componentCls + hashId（不在某个形态的组件根下），
      // 所以选择器写在顶层（同 `-drag-ghost` 的写法）
      [`${componentCls}-pagination`]: {marginTop: `${margin} !important`},
    },
  ]
}

export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle, {order: 0})

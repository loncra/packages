import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genBasicCrudQueryStyle(token: LoncraStyleToken): CSSInterpolation {
  /**
   * ⚠️ token 里的 `componentCls` / `antCls` **各自已经带前导点**：`componentCls` = `.loncra-xxx`、
   * `antCls` = `.ant`（**没有**尾横杠）。所以拼接一律写 `${antCls}-card-body`（→ `.ant-card-body`），
   * **不要**再补一个字面量点：多一个点会拼出非法的 `..ant-card-body` —— **规则照样出现在样式表里，
   * 但永不匹配**（2026-09-23 踩过，排查了半天；改完务必去 DevTools 看生成的选择器文本）。
   */
  const {componentCls, antCls, margin} = token

  return [
    {
      // 统一分页由基类渲染；分页元素自己带 componentCls + hashId（不在某个形态的组件根下），
      // 所以选择器写在顶层（同 `-drag-ghost` 的写法）
      [`${componentCls}-pagination`]: {marginTop: margin},
      /**
       * `plain`（朴素卡片）：卡片根就是本组件的根元素，所以这里直接写在 `&` 上 ——
       * 去掉边框 + 去掉 body 内边距（等价宿主以前复制的 `{root:'border-none', body:'p-0!'}`，
       * 但走 pro 自己的 CSS-in-JS，pro 不带 Tailwind）。
       *
       * ⚠️ **类名故意写两遍来提权**：`:where(...)` 里的作用域类是 0 权重 ⇒ 只写一个类的话本规则是
       * (0,1,0)，跟 antd Card 自带的 `.ant-card-bordered` 打平，**谁后注入谁赢（不稳定）**；
       * 重复一次得到 (0,2,0)，子规则 (0,3,0)，与注入顺序 / 层序都无关。
       * 另：**别指望用宿主 `classes` 覆盖 `plain` 已设的属性**（同属性冲突看层序，不可靠）。
       */
      [`${componentCls}-plain`]: {
        border: 'none',
        [`& > ${antCls}-card-body`]: {padding: 0},
      },
    },
  ]
}

export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle)

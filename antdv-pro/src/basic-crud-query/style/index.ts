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
      // 所以选择器写在顶层（同 `-drag-ghost` 的写法）。
      //
      // ⚠️ 这条**必须 `!important`**（2026-09-30 DevTools 实测）：分页元素同时被 antd 自己的
      // `.ant-pagination {margin: 0}` 命中 —— 双方特异性同为 (0,1,0)（本条是**顶层键**，hashId 不进选择器）。
      // 而本仓样式整体住在 `@layer antd` ⇒ cssinjs 把 `prepend` 从 'queue' 关成 `false`
      // （`useStyleRegister.js` / `dynamicCSS.js`：priority 只在 queue 模式下参与插入排序）⇒
      // **打平一律"后注册的赢"** ⇒ antd 的分页样式（子组件、后注册）永远压过我们 ⇒ `!important` 是唯一稳定手段。
      [`${componentCls}-pagination`]: {marginTop: `${margin} !important`},
    },
  ]
}

/**
 * ⚠️ **`order: 1` 在本仓不是样式覆盖的保障**：本仓样式整体住在 `@layer antd` ⇒ cssinjs 的
 * `prepend` 被关成 `false` ⇒ `order` 不参与 `<style>` 的插入排序（见上面那条的说明）。
 * 留着无害（将来若关掉 layer 它才生效）；**与 antd 同特异性竞争时请用 `!important` 并写明依据**。
 */
export default genStyleHooks('BasicCrudQuery', genBasicCrudQueryStyle, {order: 1})

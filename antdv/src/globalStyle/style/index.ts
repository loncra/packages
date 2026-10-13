import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

/** 全局样式类的统一前缀（`componentCls` ⇒ `.loncra-common`）；全局类名一律 `${GLOBAL_PREFIX}-xxx` */
export const GLOBAL_PREFIX = 'loncra-common'

function genGlobalStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls} = token
  return {
    /**
     * `-full-spin`：让 `Spin` 参与父级高度链（用法：把 `loncra-common-full-spin` **直接挂在 `Spin` 上**）。
     *
     * 背景：本 fork 的 `Spin` 带 children 时，根元素就是 `.ant-spin` 自身、子级直接是
     * `.ant-spin-container`，这两层默认都没有高度 ⇒ `Spin` 成了高度链的断点：里面的内容只能按
     * 内容高度显示（卡片铺不满、`Empty` 贴顶不居中、内部 `flex: 1 1 auto` 的滚动区不生效）。
     * `height: 100%` 在父级高度是 `auto` 时按 `auto` 解析 = 等于没加，所以这条是纯增量、无副作用。
     * 与组件自己的样式不抢属性：antd 的 `.ant-spin` 只设 `position: relative`、
     * `.ant-spin-container` 只设 `position / transition`（`antdv-next/dist/spin/style/index.js:11-54`），
     * 这里设的 `width / height / minHeight / display / flexDirection` 都是它没写过的。
     *
     * ⚠️ 必须是**顶层 key**，别嵌进 `[componentCls]` 里：cssinjs 只给顶层选择器注入
     * `:where(.css-hash)`（`@antdv-next/cssinjs/dist/hooks/useStyleRegister.js:73-75`），
     * 嵌进去会生成 `.loncra-common .loncra-common-full-spin` —— 那就得有个带 hashId 的作用域祖先，
     * 而 teleport 到 `body` 的弹层/抽屉（modal / drawer / message）拿不到它 ⇒ **静默失效**。
     * 顶层直挂生成的是 `:where(.css-hash).loncra-common-full-spin`：目标元素自己带主题 hashId 类就够了，
     * 而 antd 组件根**本来**就带（`antdv-next/dist/spin/index.js:92`、`dist/app/App.js:45`）。
     * ⇒ 反过来说，这个类**只能挂在 antd 组件根上**（如 `a-spin`）；挂在裸 `<div>` 上不会命中
     * （2026-10-13 用真实 cssinjs `parseStyle` 跑过，生成的就是上面这条选择器）。
     */
    [`${componentCls}-full-spin`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      [`> ${antCls}-spin-container`]: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
    },
  }
}

/**
 * ⚠️ 光有这个文件**不会生成任何 CSS**：cssinjs 是"谁调 `useStyle` 谁生成、按 path 去重"。
 * 落地那一次在 `GlobalStyleProvider`（由 `@loncra/antdv-pro` 的 `LProvider` 放在 `ConfigProvider` 里渲染）。
 */
export default genStyleHooks('GlobalStyle', genGlobalStyle, {order: 1})

import type {CSSObject} from '@antdv-next/cssinjs'
import {Keyframes} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genFileConversationStyle(token: LoncraStyleToken): CSSObject {
  const {
    componentCls,
    prefixCls,
    colorBorderSecondary,
    lineWidth,
    lineType,
    paddingXS,
    motionDurationSlow,
  } = token

  /**
   * 树节点「加载中」图标的旋转动画。
   *
   * ⚠️ **必须用 `Keyframes` 类，不能写成普通对象的 `'@keyframes xxx'`**（2026-09-30 读 cssinjs 源码确认）：
   * `parseStyle` 只把带 `_keyframe` 的 `Keyframes` **实例**交给 `parseKeyframes`
   * （`@antdv-next/cssinjs` 的 `useStyleRegister.js:45-54`）⇒ `to` / `from` 保持原样；
   * 而普通对象那条路会给**子选择器注入 hashId**（同文件 `:74-76` 的 `injectSelectorHash`）⇒
   * 生成 `to:where(.css-xxx)` —— **不是合法的 keyframe 选择器** ⇒ 关键帧被浏览器整段丢掉、
   * **动画静默失效**（不报错，只是不转）。这与有没有 tailwindcss 无关（产物是纯 CSS）。
   *
   * 名字用 `token.prefixCls`（**不带点的那个前缀**）—— antd 自己的 `carousel/style` 就是
   * `new Keyframes(\`${token.prefixCls}-dot-animation\`, …)` ⇒ 照抄这个口径：跟随 `getPrefixCls`
   * （ConfigProvider / `prefixCls` prop 换前缀时名字跟着变），也不再硬编码前缀。
   * 放在**函数内**同样是跟 antd 一致：模块级拿不到 token（那时 `prefixCls` 还不存在）。
   */
  const spinKeyframes = new Keyframes(`${prefixCls}-spin`, {
    to: {transform: 'rotate(360deg)'},
  })

  return {
    [`${componentCls}-side`]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-toolbar`]: {
      width: '100%',
      flexShrink: 0,
      padding: paddingXS,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-icon-spin`]: {
      marginBottom: 3,
      // 给 `Keyframes` **实例**（不是字符串）：cssinjs 会换成 `getName(hashId)`（带 hashId，不撞车）
      animationName: spinKeyframes,
      animationDuration: motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
  }
}

export default genStyleHooks('FileConversation', genFileConversationStyle, {order: 1})

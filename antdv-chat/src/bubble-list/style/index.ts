import {type CSSInterpolation, Keyframes} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 气泡容器外壳（`ax-bubble-list` + 回到底部按钮）的**默认样式**。
 *
 * 宿主 `components/basic/chat/BubbleList.vue` 里那 5 处宿主 Tailwind，逐条落成 token（2026-10-01 迁入）：
 *
 * | 原宿主 Tailwind | 这里 |
 * |---|---|
 * | 根 `h-full min-h-0 overflow-hidden relative flex-[1_1_0]` | 结构（静态值） |
 * | 列表 `min-h-0 h-full flex` | 结构（静态值，挂 `-list`） |
 * | `:classes="{scroll:'pl-xs pr-xs'}"` | `paddingInline: paddingXS`（= `--ant-padding-xs`） |
 * | 回到底部容器 `absolute bottom-0 mb-sm left-1/2 -translate-x-1/2 animate-bounce` | 定位 + `marginSM` + 包内 `-bounce` 关键帧 |
 * | 按钮 `shadow-card` | `boxShadowCard`（antd 内建 alias token，= `--ant-box-shadow-card`） |
 *
 * ⚠️ **只出默认、不封死**：宿主用语义 `classNames` / `styles` 覆盖（见 `BubbleListSemanticName`），
 * 或不带参数地给 `class`／`style`（fallthrough 到根）。
 */
function genBubbleListStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, prefixCls, paddingXS, marginSM, boxShadowCard} = token

  /**
   * 「回到底部」按钮的弹跳（= Tailwind `animate-bounce`）。
   *
   * ⚠️ **必须用 `Keyframes` 实例**，不能写成普通对象的 `'@keyframes xxx'`
   * （证据与解释见 `antdv-pro/src/file-editor/style/index.ts:24-36`：cssinjs 只对 `Keyframes` **实例**
   * 走 `parseKeyframes`；普通对象会给子选择器注入 hashId ⇒ 生成 `to:where(.css-xxx)` 这种**非法
   * keyframe 选择器** ⇒ 关键帧被整段丢弃、**连样式块一起失效**）。
   * 名字用**不带点**的 `prefixCls`（照 antd `carousel` / 本仓 `file-editor` 口径；随 `getPrefixCls` 变）。
   *
   * ⚠️ **居中（-50%）写进每一帧**：原模板是 `left-1/2 -translate-x-1/2` + `animate-bounce`，
   * 而 bounce 的关键帧本身写 `transform` ⇒ 不合并进关键帧就会互相覆盖、按钮横向跳走。
   */
  const bounceKeyframes = new Keyframes(`${prefixCls}-bounce`, {
    '0%, 100%': {
      transform: 'translate(-50%, -25%)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translate(-50%, 0)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  })

  return {
    [componentCls]: {
      // 根：撑满 + 自成滚动上下文（原 `h-full min-h-0 overflow-hidden relative flex-[1_1_0]`）
      position: 'relative',
      display: 'flex',
      flex: '1 1 0',
      /*
       * 宿主的 `h-full` ⇒ 照搬。❗**2026-10-01 曾经误删又加回**：当时以为它导致子元素被拉伸，
       * 真正的原因是**实现层把根类泄漏到了子元素**（见 `BubbleList.tsx` 的 `semanticClass` 注释）——
       * 修掉泄漏后，这条 `height: 100%` 不再影响任何子元素，就该照宿主原样保留。
       */
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',

      // 列表：高度限制交给 x（原 `min-h-0 h-full flex`）
      [`${componentCls}-list`]: {
        display: 'flex',
        height: '100%',
        minHeight: 0,
      },

      // 滚动区左右内边距（原 `pl-xs pr-xs`）
      [`${componentCls}-scroll`]: {
        paddingInline: paddingXS,
      },

      // 回到底部：定位 + 弹跳（原 `absolute bottom-0 mb-sm left-1/2 -translate-x-1/2 animate-bounce`）
      //
      // ⚠️ **不要给它加 `height` / `align-items` / `justify-content`**（2026-10-01 用户两次截图定案）：
      //   · 根有确定高度时，它（「绝对定位 + flex 容器」）会被 `align-self: stretch` 拉到**整列高**
      //     ⇒ 按钮变**高椭圆**；
      //   · 加 `align-items: center` 或 `height: fit-content` ⇒ 按钮退回自身尺寸 ⇒ 变**扁椭圆**。
      //   保持"不写高度 + 容器默认 stretch"⇒ 与迁移前 `a-space-compact` 相同的观感（正圆、贴底居中）。
      //   （`display: flex` 由 antd `Flex` 的 `.ant-flex` 提供，不需要我们再写。）
      [`${componentCls}-scroll-to-bottom`]: {
        position: 'absolute',
        bottom: 0,
        left: '50%',
        marginBottom: marginSM,
        // 给 `Keyframes` **实例**（不是字符串）：cssinjs 会换成带 hashId 的名字（与 `file-editor` 同款）
        animationName: bounceKeyframes,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
      },
      [`${componentCls}-scroll-to-bottom-button`]: {
        boxShadow: boxShadowCard,
      },
    },
  }
}

export default genStyleHooks('BubbleList', genBubbleListStyle)

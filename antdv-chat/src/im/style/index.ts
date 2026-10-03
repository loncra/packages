import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * `l-im` 外壳（Splitter 两栏 + 左栏底部切换条）的默认样式。
 *
 * 逐条对应宿主 `views/common/my/MyChatMessage.vue:211-238` 那套：
 * 外层 `<div class="h-full min-h-0">` → `<a-splitter class="h-full min-h-0">`，
 * 左栏 `<a-splitter-panel class="h-full p-0 overflow-hidden" default-size="20%" min="15%" max="25%">`，
 * 右栏 `<a-splitter-panel class="h-full min-h-0 overflow-hidden">`，
 * 切换条 `<div class="shrink-0 p-xs bg-layout -ml-1px">`。
 *
 * ⚠️ **比例（20%/15%/25%）不是样式，是 `SplitterPanel` 的 props**（`defaultSize`/`min`/`max`），
 * 所以它们写在 `ImChat.tsx` 里；这里只管外观与几何（撑满、裁切、左栏竖排、切换条贴边）。
 * 根节点**不覆盖 `display`** —— Splitter 自己的布局由 antd 管理，我们只给高度/裁切。
 */
function genImChatStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXS, colorBgLayout, lineWidth} = token
  return {
    [componentCls]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },

    // 左栏：内部要竖排（列表区吃掉剩余高度 + 底部切换条）
    [`${componentCls}-pane-left`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      padding: 0,
    },

    // 右栏：同上（顶部头部 + 气泡区 + 发送器）
    [`${componentCls}-pane-right`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      padding: 0,
    },

    // 切换条（原 `shrink-0 p-xs bg-layout -ml-1px`：负外边距盖住分隔条那 1px）
    [`${componentCls}-switch`]: {
      flex: '0 0 auto',
      padding: paddingXS,
      background: colorBgLayout,
      marginInlineStart: token.calc(lineWidth).mul(-1).equal(),
    },
  }
}

export default genStyleHooks('ImChat', genImChatStyle)

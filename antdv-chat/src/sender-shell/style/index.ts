import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 槽气泡内容的**默认样式**。
 *
 * 原宿主 `components/basic/chat/SenderSlotBubbleContent.vue` 的文本 span 上有一处宿主 Tailwind：
 * `whitespace-pre-wrap wrap-break-word`（Tailwind v4 的 `wrap-break-word` = `overflow-wrap: break-word`）
 * ⇒ 落成纯 CSS（无主题语义，不进 token）。
 */
function genSenderSlotBubbleContentStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls} = token

  return {
    [`${componentCls}-text`]: {
      whiteSpace: 'pre-wrap',
      overflowWrap: 'break-word',
    },
  }
}

export default genStyleHooks('SenderSlotBubbleContent', genSenderSlotBubbleContentStyle)

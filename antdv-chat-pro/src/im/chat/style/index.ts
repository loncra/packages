import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {JUMP_KEYFRAMES, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

export const IM_CHAT_VIEW_PREFIX = 'loncra-im-chat-view'

function genImChatViewStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, marginSM, marginXS, lineWidth, lineType, colorBorderSecondary} = token
  return {
    [componentCls]: {
      display: 'flex',
      flex: '1 1 0%',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      position: 'relative',
      [`${componentCls}-footer`]: {
        flexShrink: 0,
        padding: paddingSM,
        borderTop: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
      },
      [`${componentCls}-jump`]: {
        position: 'absolute',
        top: marginXS,
        marginTop: marginSM,
        left: '50%',
        zIndex: 1,
        boxShadow: 'var(--ant-box-shadow-card)',
        animationName: JUMP_KEYFRAMES,
        animationDuration: '1s',
        animationIterationCount: 'infinite',
      },
    },
  }
}

export default genStyleHooks('ImChatView', genImChatViewStyle, {order: 4})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

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
        borderTop: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
      },
      [`${componentCls}-jump`]: {
        position: 'absolute',
        top: marginXS,
        marginTop: marginSM,
        left: '50%',
        zIndex: 1,
        boxShadow: 'var(--ant-box-shadow-card)',
        animationName: 'loncra-im-chat-jump',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
      },
    },
    '@keyframes loncra-im-chat-jump': {
      '0%, 100%': {
        transform: 'translateX(-50%) translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateX(-50%)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  }
}

export default genStyleHooks('ImChatView', genImChatViewStyle, {order: 1})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const IM_CONVERSATION_PREFIX = 'loncra-im-conversation'

function genImConversationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    calc,
    colorWarning,
    colorError,
    colorBgElevated,
    colorBorder,
    colorWhite,
    fontSizeSM,
    sizeXXS,
    paddingSM,
    marginXL,
    marginSM,
    colorTextQuaternary
  } = token
  return {
    [componentCls]: {
      [`${componentCls}-search`]: {
        flexShrink: 0,
        padding: paddingSM,
        borderBlockEnd: `1px solid ${colorBorder}`,
        [`.anticon-search`]: {
          color: colorTextQuaternary,
        },
      },
      [`${componentCls}-icon`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        lineHeight: 0,
      },
      [`${componentCls}-avatar`]: {
        position: 'relative',
        display: 'inline-flex',
      },
      [`${componentCls}-avatars`]: {
        [`> *:not(:first-child)`]: {
          marginInlineStart: calc(marginXL).mul(-1).equal(),
        },
      },
      [`${componentCls}-icon-muted`]: {
        opacity: 0.8,
      },
      [`${componentCls}-marks`]: {
        position: 'absolute',
        insetInlineStart: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'flex-end',
        [`> *:not(:first-child)`]: {
          marginInlineStart: calc(marginSM).mul(-1).equal(),
        },
      },
      [`${componentCls}-mark`]: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: calc(sizeXXS).div(2).equal(),
        borderRadius: '50%',
        fontSize: fontSizeSM,
        lineHeight: 1,
        opacity: 0.5,
      },
      [`${componentCls}-pin`]: {
        color: colorWhite,
        background: colorWarning,
        border: `1px solid ${colorBorder}`,
      },
      [`${componentCls}-mute`]: {
        color: colorError,
        background: colorBgElevated,
        border: `1px dashed ${colorBorder}`,
      },
      [`${componentCls}-mentions`]: {
        maxHeight: 240,
        overflow: 'auto',
      },
    },
  }
}

export default genStyleHooks('ImConversation', genImConversationStyle, {order: 1})

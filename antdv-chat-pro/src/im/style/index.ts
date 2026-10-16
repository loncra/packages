import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

export const IM_CHAT_PREFIX = 'loncra-im-chat'

function genImChatStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXS, colorBgLayout} = token
  return {
    [componentCls]: {
      height: '100%',
      minHeight: 0,
      [`${componentCls}-side`]: {
        height: '100%',
        paddingLeft: 0,
        overflow: 'hidden',
      },
      [`${componentCls}-column`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
      [`${componentCls}-switch`]: {
        flexShrink: 0,
        padding: paddingXS,
        background: colorBgLayout,
      },
      [`${componentCls}-main`]: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      },
      [`${componentCls}-stage`]: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
      },
      [`${componentCls}-empty`]: {
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-drawer`]: {
        height: '100%',
        minHeight: 0,
      },
    },
  }
}

export default genStyleHooks('ImChat', genImChatStyle, {order: 4})

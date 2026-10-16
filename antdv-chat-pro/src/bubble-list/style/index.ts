import {Keyframes, type CSSInterpolation} from '@antdv-next/cssinjs'
import {GLOBAL_JUMP_KEYFRAMES, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

export const BUBBLE_LIST_PREFIX = 'loncra-bubble-list'

const bubbleFlash = new Keyframes('loncraBubbleListFlash', {
  '0%, 100%': {
    opacity: 1,
  },
  '50%': {
    opacity: 0,
  },
})

function genBubbleListStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    paddingXS,
    marginSM,
    marginXS,
    boxShadowSecondary,
    colorPrimaryBg,
    colorTextSecondary,
    fontSizeSM,
  } = token

  const quietText = {
    color: colorTextSecondary,
    fontSize: fontSizeSM,
    fontWeight: 'normal' as const,
  }

  return [
    bubbleFlash,
    {
      [componentCls]: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        position: 'relative',
        flex: '1 1 0',

        [`${componentCls}-list`]: {
          minHeight: 0,
          height: '100%',
          display: 'flex',
        },
        [`${componentCls}-scroll`]: {
          paddingInline: paddingXS,
        },
        [`${componentCls}-jump`]: {
          position: 'absolute',
          bottom: 0,
          marginBottom: marginSM,
          left: '50%',
          boxShadow: boxShadowSecondary,
          animationName: GLOBAL_JUMP_KEYFRAMES,
          animationDuration: '1s',
          animationIterationCount: 'infinite',
        },
        [`${componentCls}-flash`]: {
          borderRadius: 'inherit',
          animationName: bubbleFlash,
          animationDuration: '0.9s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 2,
        },
        [`${componentCls}-user`]: {
          background: colorPrimaryBg,
        },
        [`${componentCls}-avatar`]: {
          flex: 'none',
          alignSelf: 'flex-start',
        },
        [`${componentCls}-system`]: {
          color: colorTextSecondary,
        },
        [`${componentCls}-divider, ${componentCls}-divider-root`]: {
          ...quietText,
          marginBlock: marginXS,
        },
      },
    },
  ]
}

export default genStyleHooks('BubbleList', genBubbleListStyle, {order: 4})

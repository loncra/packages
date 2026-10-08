import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {Keyframes} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const BUBBLE_LIST_PREFIX = 'loncra-bubble-list'

const jumpBounce = new Keyframes('loncraBubbleListJump', {
  '0%, 100%': {
    transform: 'translateX(-50%) translateY(-25%)',
  },
  '50%': {
    transform: 'translateX(-50%)',
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
    jumpBounce,
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
          animationName: jumpBounce,
          animationDuration: '1s',
          animationIterationCount: 'infinite',
        },
        [`${componentCls}-user`]: {
          background: colorPrimaryBg,
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

export default genStyleHooks('BubbleList', genBubbleListStyle, {order: 1})

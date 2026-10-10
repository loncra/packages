import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const IM_HISTORY_PREFIX = 'loncra-im-history'

function genImHistoryStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, margin, paddingXS, borderRadiusLG, colorFillQuaternary} = token
  return {
    [componentCls]: {
      [`${componentCls}-list`]: {
        maxHeight: '25rem',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: margin,
      },
      [`${componentCls}-main`]: {
        minWidth: 0,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      },
      [`${componentCls}-title`]: {
        display: 'flex',
        alignItems: 'center',
      },
      [`${componentCls}-name`]: {
        flex: 1,
        minWidth: 0,
      },
      [`${componentCls}-pager`]: {
        display: 'flex',
        justifyContent: 'center',
      },
      [`${componentCls}-row`]: {
        display: 'flex',
        gap: margin,
        padding: paddingXS,
        borderRadius: borderRadiusLG,
        '&:hover': {
          backgroundColor: colorFillQuaternary,
          [`${componentCls}-locate`]: {
            opacity: 1,
          },
        },
      },
      [`${componentCls}-locate`]: {
        opacity: 0,
      },
    },
  }
}

export default genStyleHooks('ImHistory', genImHistoryStyle, {order: 1})

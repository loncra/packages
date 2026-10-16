import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

export const APP_NOTIFICATION_PREFIX = 'loncra-app-notification'

function genAppNotificationStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, colorTextSecondary, lineHeight} = token
  return {
    [componentCls]: {
      [`${componentCls}-description`]: {
        margin: 0,
        color: colorTextSecondary,
      },
      [`${componentCls}-icon`]: {
        display: 'flex',
        alignItems: 'center',
        color: 'inherit',
        lineHeight,
      },
      [`${componentCls}-title`]: {
        fontWeight: 500,
      },
    },
  }
}

export default genStyleHooks('AppNotification', genAppNotificationStyle, {order: 2})

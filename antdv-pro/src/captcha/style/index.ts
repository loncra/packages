import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

export const CAPTCHA_SEND_BUTTON_PREFIX = 'loncra-captcha-send-button'

function genCaptchaSendButtonStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, fontSize} = token
  return {
    [componentCls]: {
      [`${componentCls}-countdown`]: {
        fontSize,
        '& .ant-statistic': {
          display: 'inline-block',
        },
        '& .ant-statistic-content': {
          fontSize,
          color: 'inherit',
        },
        '& .ant-statistic-content-value': {
          fontSize,
        },
      },
    },
  }
}

export default genStyleHooks('CaptchaSendButton', genCaptchaSendButtonStyle, {order: 3})

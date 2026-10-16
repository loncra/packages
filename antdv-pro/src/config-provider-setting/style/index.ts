import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genConfigProviderSettingStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, fontSizeSM} = token

  return {
    [`${componentCls}-row-label`]: {whiteSpace: 'nowrap'},
    [`${componentCls}-row-sub`]: {fontSize: fontSizeSM},
    [`${componentCls}-token-input`]: {width: 420},
  }
}

export default genStyleHooks('ConfigProviderSetting', genConfigProviderSettingStyle, {order: 2})

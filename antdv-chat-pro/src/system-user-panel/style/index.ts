import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genSystemUserPanelStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, paddingXS, colorTextQuaternary, lineWidth, lineType, colorBorderSecondary} = token
  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      height: '100%',
    },
    [`${componentCls}-list`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 320,
      overflow: 'hidden',
    },
    [`${componentCls}-list-full`]: {
      width: '100%',
    },
    [`${componentCls}-list-split`]: {
      width: '30%',
    },
    [`${componentCls}-search`]: {
      flexShrink: 0,
      padding: paddingSM,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-search-icon`]: {
      color: colorTextQuaternary,
    },
    [`${componentCls}-conversations`]: {
      minHeight: 0,
      width: '100%',
      flex: '1 1 0',
      padding: 0,
      gap: 0,
    },
    [`${componentCls}-item`]: {
      height: 'auto',
      minHeight: 'auto',
      borderRadius: 0,
      padding: paddingXS,
    },
    [`${componentCls}-label`]: {
      flex: 1,
    },
    [`${componentCls}-selected-panel`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 320,
      padding: paddingSM,
      width: '70%',
    },
    [`${componentCls}-selected-divider`]: {
      marginTop: 0,
    },
    [`${componentCls}-selected-item`]: {
      width: 50,
    },
    [`${componentCls}-empty`]: {
      display: 'flex',
      width: '100%',
      height: '100%',
    },
  }
}

export default genStyleHooks('SystemUserPanel', genSystemUserPanelStyle, {order: 4})

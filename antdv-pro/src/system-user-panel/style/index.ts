import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genSystemUserPanelStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, paddingXS, colorTextQuaternary} = token
  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      height: '100%',
    },
    // 左侧列表：撑满父级高度，滚动交给内部 Conversations
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
    },
    [`${componentCls}-search-icon`]: {
      color: colorTextQuaternary,
    },
    [`${componentCls}-conversations`]: {
      minHeight: 0,
      width: '100%',
      flex: '1 1 0',
      padding: '0 !important',
      gap: '0 !important',
    },
    // 覆盖 Conversations 行默认的高度 / 圆角 / 内边距
    [`${componentCls}-item`]: {
      height: 'auto !important',
      minHeight: 'auto !important',
      borderRadius: '0 !important',
      padding: `${unit(paddingXS)} !important`,
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
      marginTop: '0 !important',
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

export default genStyleHooks('SystemUserPanel', genSystemUserPanelStyle)

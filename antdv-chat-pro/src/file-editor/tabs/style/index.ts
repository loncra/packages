import type {CSSObject} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../../_util/genStyleLayer'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genFileTabsStyle(token: LoncraStyleToken): CSSObject {
  const {
    componentCls,
    antCls,
    colorBgContainer,
    colorTextSecondary,
    paddingXS,
    paddingSM,
    motionDurationMid,
    calc,
  } = token

  return {
    [`${componentCls}-tabs`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
    },
    [`${componentCls}-tabs-root`]: {
      minHeight: 0,
      height: '100%',
    },
    [`${componentCls}-tabs-body`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
    },
    [`${componentCls}-tabs-content`]: {
      minHeight: 0,
      height: '100%',
    },
    [`${componentCls}-tab-item`]: {
      position: 'relative',
      padding: `${calc(paddingXS).add(1.5).equal()} ${unit(paddingSM)}`,
    },
    [`${componentCls}-tabs ${antCls}-tabs-tab + ${antCls}-tabs-tab`]: {
      margin: 0,
    },
    [`${componentCls}-tabs .anticon:not(:last-child)`]: {
      margin: 0,
    },
    [`${componentCls}-tab-header`]: {
      paddingInlineEnd: paddingXS,
      marginBottom: 0,
    },
    [`${componentCls}-tab-label`]: {
      overflow: 'hidden',
    },
    [`${componentCls}-tab-close`]: {
      position: 'absolute',
      insetInlineEnd: 0,
      top: '50%',
      zIndex: 1,
      transform: 'translateY(-50%)',
      background: colorBgContainer,
      opacity: 0,
      color: colorTextSecondary,
      transition: `opacity ${motionDurationMid}`,
      [`&${antCls}-btn`]: {
        background: colorBgContainer,
      },
    },
    [`${componentCls}-tab-item:hover ${componentCls}-tab-close`]: {
      opacity: 1,
      [`&${antCls}-btn, &${antCls}-btn:hover, &${antCls}-btn:active`]: {
        background: colorBgContainer,
        boxShadow: 'none',
      },
    },
    [`${componentCls}-grow`]: {
      flex: 1,
      minWidth: 0,
    },
  }
}

export default genStyleHooks('FileTabs', genFileTabsStyle, {order: 4})

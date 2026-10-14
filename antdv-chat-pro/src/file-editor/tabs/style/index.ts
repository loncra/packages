import type {CSSObject} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

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
      // `-tab-close` 以它（= `.ant-tabs-tab`，antd 自己也是 relative）为定位基准
      position: 'relative',
      // 下面两个 `!important` 是**必要**的：antd 的 `.ant-tabs-tab`（0,2,0）与
      // `.ant-tabs-tab + .ant-tabs-tab`（0,3,0）都压在只写语义类的这条（0,1,0）上面
      padding: `${calc(paddingXS).add(1.5).equal()} ${unit(paddingSM)} !important`,
    },
    [`${antCls}-tabs ${antCls}-tabs-tab + ${antCls}-tabs-tab, .anticon:not(:last-child)`]: {
      margin: '0 !important',
    },
    [`${componentCls}-tab-header`]: {
      paddingInlineEnd: paddingXS,
      // 与上面 `-tab-item` 那两处同理：要压的 antd 规则比本选择器**更具体** ⇒ `!important` 留着
      marginBottom: `0 !important`,
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
      // 淡入淡出，别"闪"（hover 判定在 `-tab-item` 上，见下一条）
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

export default genStyleHooks('FileTabs', genFileTabsStyle, {order: 1})

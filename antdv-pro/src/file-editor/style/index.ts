import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genFileEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    colorBorderSecondary,
    colorBgContainer,
    colorBgLayout,
    colorTextSecondary,
    borderRadiusLG,
    paddingXS,
    paddingSM,
    marginXS,
    controlHeightSM,
    lineWidth,
    lineType,
    antCls,
    motionDurationMid,
  } = token

  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      minHeight: '30rem',
      height: '30rem',
      maxHeight: '45rem',
      overflow: 'hidden',
      flexDirection: 'column',
      [`${antCls}-splitter`]: {
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      },
      [`${antCls}-splitter ${antCls}-splitter-panel`]: {
        minHeight: 0,
        overflow: 'hidden',
        padding: 0,
      },
      [`${componentCls}-menu`]: {
        border: 'none',
        [`&${antCls}-menu-light${antCls}-menu-root${antCls}-menu-inline, &${antCls}-menu-light${antCls}-menu-root${antCls}-menu-vertical, &${antCls}-menu-dark${antCls}-menu-root${antCls}-menu-inline, &${antCls}-menu-dark${antCls}-menu-root${antCls}-menu-vertical`]:
          {
            borderBottom: 0,
            borderInlineEnd: 0,
          },
        [`${antCls}-menu-inline, ${antCls}-menu-horizontal`]: {
          borderBottom: 0,
          borderInlineEnd: 0,
        },
        [`&${antCls}-menu-light${antCls}-menu-inline ${antCls}-menu-sub${antCls}-menu-inline, &${antCls}-menu-dark${antCls}-menu-inline ${antCls}-menu-sub${antCls}-menu-inline`]:
          {
            background: colorBgContainer,
          },
        [`${antCls}-menu-submenu > ${antCls}-menu`]: {
          backgroundColor: colorBgContainer,
        },
        [`&${antCls}-menu-inline ${antCls}-menu-item, &${antCls}-menu-inline ${antCls}-menu-submenu-title`]:
          {
            height: 32,
            lineHeight: '32px',
            marginBottom: 0,
            paddingInlineEnd: paddingXS,
          },
        [`${antCls}-menu-sub${antCls}-menu-inline > ${antCls}-menu-submenu > ${antCls}-menu-submenu-title`]:
          {
            height: 32,
            lineHeight: '32px',
            marginBottom: 0,
            paddingInlineEnd: paddingXS,
          },
      },
    },
    [`${componentCls}-hidden-upload`]: {
      display: 'none',
    },
    [`${componentCls}-splitter`]: {
      borderRadius: borderRadiusLG,
      border: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-panel`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
    [`${componentCls}-panel-main`]: {
      minHeight: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
    [`${componentCls}-side`]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-toolbar`]: {
      width: '100%',
      flexShrink: 0,
      padding: paddingXS,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-tree`]: {
      minHeight: 0,
      flex: 1,
      overflowY: 'auto',
    },
    [`${componentCls}-spin`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      [`&${antCls}-spin, &${antCls}-spin-nested-loading`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
      [`${antCls}-spin-container`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      },
      [`&${antCls}-spin-nested-loading > div > ${antCls}-spin`]: {
        maxHeight: 'none',
        height: '100%',
      },
    },
    [`${componentCls}-grow`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-row`]: {
      minWidth: 0,
      width: '100%',
    },
    [`${componentCls}-more`]: {
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    [`${componentCls}-more-btn`]: {
      position: 'absolute',
      opacity: 0,
      transition: `opacity ${motionDurationMid}`,
    },
    [`${componentCls}-row:hover ${componentCls}-more-btn`]: {
      position: 'static',
      opacity: 1,
    },
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
      padding: `${token.calc(paddingXS).add(1.5).equal()} ${unit(paddingSM)} !important`,
      // 逻辑属性（RTL 会跟着翻）—— 别写 `marginLeft`
      marginInlineStart: `${unit(marginXS)} !important`,
    },
    [`${componentCls}-tab-header`]: {
      paddingInlineEnd: paddingXS,
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
    [`${componentCls}-icon-spin`]: {
      marginBottom: 3,
      animationName: 'loncra-file-editor-spin',
      animationDuration: token.motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
    '@keyframes loncra-file-editor-spin': {
      to: {
        transform: 'rotate(360deg)',
      },
    },
    [`${componentCls}-pane`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
    [`${componentCls}-media`]: {
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: paddingXS,
    },
    [`${componentCls}-media-img, ${componentCls}-media-video`]: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    [`${componentCls}-media-video`]: {
      background: colorBgLayout,
    },
    [`${componentCls}-media-audio`]: {
      width: '100%',
      maxWidth: '36rem',
    },
    [`${componentCls}-editor`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
  }
}

export default genStyleHooks('FileEditor', genFileEditorStyle, {order: 0})

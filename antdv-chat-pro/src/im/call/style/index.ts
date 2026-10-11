import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const IM_CALL_PREFIX = 'loncra-im-call'

function genImCallStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    antCls,
    paddingXS,
    marginXS,
    borderRadiusLG,
    colorBgContainer,
    colorBgLayout,
    colorBorderSecondary,
    colorText,
    boxShadow,
    fontSize,
    lineHeight,
  } = token

  return {
    [componentCls]: {
      [`${antCls}-modal ${antCls}-modal-container`]: {
        padding: 0,
      },
      [`${antCls}-modal ${antCls}-modal-header`]: {
        margin: 0,
        padding: paddingXS,
        textAlign: 'center',
      },
      [`${antCls}-modal ${antCls}-modal-body`]: {
        padding: 0,
      },
      [`&${componentCls}-minimized`]: {
        pointerEvents: 'none',
        overflow: 'visible',
        [`&${antCls}-modal-wrap, ${antCls}-modal-wrap`]: {
          position: 'static',
          overflow: 'visible',
        },
        [`${antCls}-modal`]: {
          position: 'fixed',
          top: 'auto',
          right: 'auto',
          bottom: 0,
          left: 0,
          maxWidth: 'none',
          margin: marginXS,
          padding: 0,
          pointerEvents: 'auto',
          transform: 'none',
        },
        [`${antCls}-modal-header`]: {
          display: 'none',
        },
        [`${antCls}-modal-content`]: {
          overflow: 'hidden',
          borderRadius: borderRadiusLG,
          boxShadow,
        },
      },
      [`${componentCls}-viewport`]: {
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        background: '#000',
        '&:fullscreen': {
          width: '100%',
          height: '100%',
          minHeight: '100%',
          maxWidth: 'none',
          maxHeight: 'none',
          borderRadius: 0,
          [`${componentCls}-stage`]: {
            width: '100%',
            height: '100%',
            minHeight: '100%',
          },
        },
      },
      [`${componentCls}-viewport-mini`]: {
        borderRadius: borderRadiusLG,
        cursor: 'pointer',
      },
      [`${componentCls}-viewport-expanded`]: {
        borderBottomLeftRadius: borderRadiusLG,
        borderBottomRightRadius: borderRadiusLG,
      },
      [`${componentCls}-viewport-fill`]: {
        width: '100%',
        height: '100%',
        minHeight: '25rem',
      },
      [`${componentCls}-stage`]: {
        position: 'relative',
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-stage-mini`]: {
        background: '#000',
        cursor: 'pointer',
      },
      [`${componentCls}-stage-full`]: {
        background: '#000',
      },
      [`${componentCls}-stage-window`]: {
        background: colorBgLayout,
      },
      [`${componentCls}-row`]: {
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-fill`]: {
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
      [`${componentCls}-split`]: {
        flex: '1 1 0',
        width: 0,
        minWidth: 0,
        height: '100%',
      },
      [`${componentCls}-shrink`]: {
        flexShrink: 0,
        minWidth: 0,
      },
      [`${componentCls}-pip`]: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        margin: marginXS,
        opacity: 0.8,
        borderRadius: borderRadiusLG,
        border: `1px solid ${colorBorderSecondary}`,
        background: colorBgContainer,
        boxShadow,
        cursor: 'pointer',
      },
      [`${componentCls}-placeholder`]: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colorBgContainer,
      },
      [`${componentCls}-video`]: {
        display: 'block',
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-video-cover`]: {
        objectFit: 'cover',
      },
      [`${componentCls}-video-contain`]: {
        objectFit: 'contain',
      },
      [`${componentCls}-toolbar`]: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        padding: paddingXS,
        opacity: 0,
        transition: 'opacity 0.3s',
      },
      [`${componentCls}-viewport:hover ${componentCls}-toolbar`]: {
        opacity: 1,
      },
      [`${componentCls}-tool`]: {
        opacity: 0.3,
      },
      [`${componentCls}-hangup`]: {
        opacity: 0.5,
      },
      [`${componentCls}-split-toggle`]: {
        position: 'absolute',
        bottom: 0,
        left: '4.75rem',
        zIndex: 30,
        margin: marginXS,
        opacity: 0,
        transition: 'opacity 0.3s',
      },
      [`${componentCls}-viewport:hover ${componentCls}-split-toggle`]: {
        opacity: 0.3,
      },
      [`${componentCls}-countdown`]: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: paddingXS,
        background: colorBgContainer,
        opacity: 0.6,
      },
      [`${componentCls}-timer`]: {
        display: 'inline-block',
        color: colorText,
        fontSize,
        lineHeight,
        [`&${antCls}-statistic, ${antCls}-statistic-content, ${antCls}-statistic-content-value`]: {
          display: 'inline',
          margin: 0,
          padding: 0,
          color: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        },
      },
      [`${componentCls}-status`]: {
        display: 'inline-flex',
        alignItems: 'center',
        color: colorText,
        fontSize,
        lineHeight,
        [`${antCls}-statistic, ${antCls}-statistic-content, ${antCls}-statistic-content-value`]: {
          display: 'inline',
          margin: 0,
          padding: 0,
          color: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
        },
      },
      [`${componentCls}-actions`]: {
        opacity: 0.8,
      },
    },
  }
}

export default genStyleHooks('ImCall', genImCallStyle, {order: 1})

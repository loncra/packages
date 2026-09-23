import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genAttachmentUploadStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    colorBorderSecondary,
    colorWarningBorder,
    colorInfoBorder,
    colorSuccessBorder,
    colorErrorBorder,
    colorWarningBg,
    colorInfoBg,
    colorSuccessBg,
    colorErrorBg,
    colorBgContainer,
    colorBgLayout,
    colorTextLightSolid,
    borderRadiusSM,
    borderRadiusLG,
    paddingXS,
    fontSizeHeading3,
    fontSizeLG,
    fontSizeSM,
    screenMD,
  } = token

  return {
    [componentCls]: {
      width: '100%',
    },
    [`${componentCls}-list`]: {
      width: '100%',
    },
    [`${componentCls}-list-cards`]: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: token.sizeSM,
    },
    [`${componentCls}-item-sm`]: {
      width: 50,
      height: 50,
    },
    [`${componentCls}-item-lg`]: {
      width: 84,
      height: 84,
    },
    [`${componentCls}-thumb`]: {
      position: 'relative',
      display: 'inline-block',
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: borderRadiusSM,
      border: `${token.lineWidth} ${token.lineType} ${colorBorderSecondary}`,
      verticalAlign: 'middle',
      [`&:hover ${componentCls}-overlay`]: {
        opacity: 1,
      },
      [`&${componentCls}-thumb-border-warning`]: {
        borderColor: colorWarningBorder,
      },
      [`&${componentCls}-thumb-border-info`]: {
        borderColor: colorInfoBorder,
      },
      [`&${componentCls}-thumb-border-success`]: {
        borderColor: colorSuccessBorder,
      },
      [`&${componentCls}-thumb-border-error`]: {
        borderColor: colorErrorBorder,
      },
    },
    [`${componentCls}-thumb-cover`]: {
      width: '100%',
      height: '100%',
      [`img, ${token.antCls}-image, ${token.antCls}-image-img`]: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
      },
    },
    [`${componentCls}-thumb-fallback`]: {
      display: 'inline-flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    [`${componentCls}-file-icon`]: {
      fontSize: fontSizeHeading3,
    },
    [`${componentCls}-overlay`]: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.sizeSM,
      background: 'rgba(0, 0, 0, 0.3)',
      opacity: 0,
      transition: `opacity ${token.motionDurationMid}`,
    },
    [`${componentCls}-overlay-uploading`]: {
      opacity: 1,
    },
    [`${componentCls}-overlay-action`]: {
      cursor: 'pointer',
      padding: token.calc(paddingXS).div(2).equal(),
      color: colorTextLightSolid,
    },
    [`${componentCls}-overlay-progress`]: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.sizeSM,
      opacity: 0.75,
      color: colorTextLightSolid,
      fontSize: fontSizeSM,
    },
    [`${componentCls}-overlay-spin`]: {
      fontSize: fontSizeLG,
      color: colorTextLightSolid,
      animationName: 'loncra-attachment-upload-spin',
      animationDuration: token.motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
    '@keyframes loncra-attachment-upload-spin': {
      to: {
        transform: 'rotate(360deg)',
      },
    },
    [`${componentCls}-grow`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-block`]: {
      display: 'block',
      width: '100%',
    },
    [`${componentCls}-card`]: {
      display: 'inline-flex',
      flexDirection: 'column',
      padding: paddingXS,
      border: `${token.lineWidth} ${token.lineType} ${colorBorderSecondary}`,
      borderRadius: borderRadiusLG,
    },
    [`${componentCls}-card-preview`]: {
      background: colorBgContainer,
    },
    [`${componentCls}-card-warning`]: {
      borderColor: colorWarningBorder,
      background: colorWarningBg,
    },
    [`${componentCls}-card-info`]: {
      borderColor: colorInfoBorder,
      background: colorInfoBg,
    },
    [`${componentCls}-card-success`]: {
      borderColor: colorSuccessBorder,
      background: colorSuccessBg,
    },
    [`${componentCls}-card-error`]: {
      borderColor: colorErrorBorder,
      background: colorErrorBg,
    },
    [`${componentCls}-meta`]: {
      marginTop: token.marginXXS,
      display: 'flex',
      width: 84,
      minWidth: 0,
      flexDirection: 'column',
      gap: token.marginXXS,
      overflow: 'hidden',
      textAlign: 'center',
    },
    [`${componentCls}-size`]: {
      display: 'none',
      flexShrink: 0,
      marginInlineStart: token.marginXXS,
      [`@media (min-width: ${screenMD})`]: {
        display: 'inline',
      },
    },
    [`${componentCls}-trigger`]: {
      display: 'inline-flex',
      flexDirection: 'column',
      padding: paddingXS,
      border: `${token.lineWidth} dashed ${colorBorderSecondary}`,
      borderRadius: borderRadiusLG,
    },
    [`${componentCls}-trigger-upload`]: {
      display: 'block',
      overflow: 'hidden',
      cursor: 'pointer',
      width: '100%',
      height: '100%',
      [`${token.antCls}-upload`]: {
        margin: 0,
        display: 'block',
        width: '100%',
        height: '100%',
      },
    },
    [`${componentCls}-trigger-upload-multi`]: {
      width: 84,
      height: 84,
    },
    [`${componentCls}-trigger-inner`]: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      width: '100%',
      height: '100%',
    },
    [`${componentCls}-trigger-inner-multi`]: {
      width: 84,
      height: 84,
    },
    [`${componentCls}-plus-icon`]: {
      fontSize: token.fontSizeHeading2,
    },
    [`${componentCls}-video`]: {
      width: '100%',
      height: '100%',
      maxHeight: 400,
      background: colorBgLayout,
    },
    [`${componentCls}-preview-hidden`]: {
      display: 'none',
    },
    /** 拖拽区里那两行标题（图标 + 文案）：不要 typography 自带的上下 margin（2026-09-23 从内联样式挪来） */
    [`${componentCls}-dragger-title`]: {
      margin: 0,
    },
  }
}

export default genStyleHooks('AttachmentUpload', genAttachmentUploadStyle)

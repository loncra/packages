import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {SPIN_KEYFRAMES, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

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
    colorBgMask,
    colorTextLightSolid,
    borderRadiusSM,
    borderRadiusLG,
    paddingXS,
    paddingSM,
    padding,
    fontSizeHeading3,
    fontSizeLG,
    fontSizeSM,
    fontSizeHeading2,
    screenMD,
    sizeSM,
    lineWidth,
    lineType,
    antCls,
    motionDurationMid,
    motionDurationSlow,
    sizeXL,
    sizeXXL,
    marginXXS,
    calc,
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
      gap: sizeSM,
    },
    [`${componentCls}-item-sm`]: {
      width: calc(sizeXL).mul(2).equal(),
      height: calc(sizeXL).mul(2).equal(),
    },
    [`${componentCls}-item-lg`]: {
      width: calc(sizeXXL).mul(2).equal(),
      height: calc(sizeXXL).mul(2).equal(),
    },
    [`${componentCls}-thumb`]: {
      position: 'relative',
      display: 'inline-block',
      flexShrink: 0,
      overflow: 'hidden',
      borderRadius: borderRadiusSM,
      border: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
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
      gap: sizeSM,
      background: colorBgMask,
      opacity: 0,
      transition: `opacity ${motionDurationMid}`,
    },
    [`${componentCls}-overlay-uploading`]: {
      opacity: 1,
    },
    [`${componentCls}-overlay-action`]: {
      cursor: 'pointer',
      padding: calc(paddingXS).div(2).equal(),
      color: colorTextLightSolid,
    },
    [`${componentCls}-overlay-progress`]: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizeSM,
      opacity: 0.75,
      color: colorTextLightSolid,
      fontSize: fontSizeSM,
    },
    [`${componentCls}-overlay-spin`]: {
      fontSize: fontSizeLG,
      color: colorTextLightSolid,
      animationName: SPIN_KEYFRAMES,
      animationDuration: motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
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
      border: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
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
      marginTop: marginXXS,
      display: 'flex',
      width: calc(sizeXXL).mul(2).equal(),
      minWidth: 0,
      flexDirection: 'column',
      gap: marginXXS,
      overflow: 'hidden',
      textAlign: 'center',
    },
    [`${componentCls}-size`]: {
      display: 'none',
      flexShrink: 0,
      marginInlineStart: marginXXS,
      [`@media (min-width: ${screenMD})`]: {
        display: 'inline',
      },
    },
    [`${componentCls}-trigger`]: {
      display: 'inline-flex',
      flexDirection: 'column',
      padding: `${paddingSM} ${padding}`,
      border: `${lineWidth} dashed ${colorBorderSecondary}`,
      borderRadius: borderRadiusLG,
    },
    [`${componentCls}-trigger-upload`]: {
      display: 'block',
      overflow: 'hidden',
      cursor: 'pointer',
      width: '100%',
      height: '100%',
      [`${antCls}-upload`]: {
        margin: 0,
        display: 'block',
        width: '100%',
        height: '100%',
      },
    },
    [`${componentCls}-trigger-upload-multi`]: {
      width: calc(sizeXXL).mul(2).equal(),
      height: calc(sizeXXL).mul(2).equal(),
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
      width: calc(sizeXXL).mul(2).equal(),
      height: calc(sizeXXL).mul(2).equal(),
    },
    [`${componentCls}-plus-icon`]: {
      fontSize: fontSizeHeading2,
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
    [`${componentCls}-dragger-title`]: {
      margin: 0,
    },
  }
}

export default genStyleHooks('AttachmentUpload', genAttachmentUploadStyle, {order: 2})

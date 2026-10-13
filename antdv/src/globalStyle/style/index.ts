import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

/** 全局样式类的统一前缀（`componentCls` ⇒ `.loncra-common`）；全局类名一律 `${GLOBAL_PREFIX}-xxx` */
export const GLOBAL_PREFIX = 'loncra-common'

function genGlobalStyle(token: LoncraStyleToken): CSSInterpolation {
    const {
      calc,
      componentCls,
      antCls,
      paddingXS,
      marginXS,
      colorBorder,
      lineWidth,
      lineType,
      colorBorderSecondary,
      sizeXL,
      sizeXXL
    } = token
    return {
        [`${componentCls}-padding-none`]: {
            padding: '0 !important',
        },
        [`${componentCls}-margin-none`]: {
            margin: '0 !important',
        },
        [`${componentCls}-padding-xs`]: {
            padding: `${paddingXS} !important`,
        },
        [`${componentCls}-border`]: {
            border: `${lineWidth} ${lineType} ${colorBorder} !important`,
            [`&-secondary`]: {
                border: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                [`&-bottom`]: {
                    borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                }
            },
        },
        [`${componentCls}-min-width-xl`]: {
          minWidth: calc(sizeXL).mul(10).equal(),
        },
        [`${componentCls}-margin-xs`]: {
            margin: `${marginXS} !important`,
        },
        [`${componentCls}-scroll`]: {
            maxHeight: calc(sizeXXL).mul(5).equal(),
            maxWidth: calc(sizeXXL).mul(10).equal(),
            overflow: 'auto',
        },
        [`${componentCls}-full-spin`]: {
            width: '100%',
            height: '100%',
            minHeight: 0,
            [`> ${antCls}-spin-container`]: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                minHeight: 0,
            },
        },
    }
}

/**
 * ⚠️ 光有这个文件**不会生成任何 CSS**：cssinjs 是"谁调 `useStyle` 谁生成、按 path 去重"。
 * 落地那一次在 `GlobalStyleProvider`（由 `@loncra/antdv-pro` 的 `LProvider` 放在 `ConfigProvider` 里渲染）。
 */
export default genStyleHooks('GlobalStyle', genGlobalStyle, {order: 1})

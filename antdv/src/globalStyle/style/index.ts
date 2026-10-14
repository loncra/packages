import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {Keyframes} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

/** 全局样式类的统一前缀（`componentCls` ⇒ `.loncra-common`）；全局类名一律 `${GLOBAL_PREFIX}-xxx` */
export const GLOBAL_PREFIX = 'loncra-common'

export const GLOBAL_SPIN_KEYFRAMES = new Keyframes(`${GLOBAL_PREFIX}-spin`, {
    to: {transform: 'rotate(360deg)'},
})

export const GLOBAL_JUMP_KEYFRAMES = new Keyframes(`${GLOBAL_PREFIX}-jump`, {
    '0%, 100%': {
        transform: 'translateX(-50%) translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
        transform: 'translateX(-50%)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
})

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
    const classes: CSSInterpolation = {
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
            [`&-b`]: {
                borderBottom: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-t`]: {
                borderTop: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-r`]: {
                borderRight: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-l`]: {
                borderLeft: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-x`]: {
                borderInline: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-y`]: {
                borderBlock: `${lineWidth} ${lineType} ${colorBorder} !important`,
            },
            [`&-secondary`]: {
                border: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                [`&-b`]: {
                    borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
                [`&-t`]: {
                    borderTop: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
                [`&-r`]: {
                    borderRight: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
                [`&-l`]: {
                    borderLeft: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
                [`&-x`]: {
                    borderInline:`${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
                [`&-y`]: {
                    borderBlock: `${lineWidth} ${lineType} ${colorBorderSecondary} !important`,
                },
            },
            [`&-none`]: {
                border: 'none !important',
                [`&-t`]: {
                    borderTop: 'none !important',
                },
                [`&-r`]: {
                    borderRight: 'none !important',
                },
                [`&-b`]: {
                    borderBottom: 'none !important',
                },
                [`&-l`]: {
                    borderLeft: 'none !important',
                },
                [`&-x`]: {
                    borderInline: 'none !important',
                },
                [`&-y`]: {
                    borderBlock: 'none !important',
                },
            }
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
    return [GLOBAL_SPIN_KEYFRAMES, GLOBAL_JUMP_KEYFRAMES, classes]
}

/**
 * ⚠️ 光有这个文件**不会生成任何 CSS**：cssinjs 是"谁调 `useStyle` 谁生成、按 path 去重"。
 * 落地那一次在 `GlobalStyleProvider`（由 `@loncra/antdv-pro` 的 `LProvider` 放在 `ConfigProvider` 里渲染）。
 */
export default genStyleHooks('GlobalStyle', genGlobalStyle, {order: 1})

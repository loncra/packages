import {Keyframes} from '@antdv-next/cssinjs'
import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from './factory'

export const SPIN_KEYFRAMES = new Keyframes('loncra-spin', {
    to: {transform: 'rotate(360deg)'},
})

export const JUMP_KEYFRAMES = new Keyframes('loncra-jump', {
    '0%, 100%': {
        transform: 'translateX(-50%) translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
        transform: 'translateX(-50%)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
})

export function genFullSpinStyle(token: LoncraStyleToken): CSSObject {
    const {componentCls, antCls} = token
    return {
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

export function genScrollAreaStyle(
    token: LoncraStyleToken,
    suffix: string,
    maxHeightMul: number,
    maxWidthMul?: number,
): CSSObject {
    const {componentCls, controlHeightLG, calc} = token
    return {
        [`${componentCls}${suffix}`]: {
            overflow: 'auto',
            maxHeight: calc(controlHeightLG).mul(maxHeightMul).equal(),
            ...(maxWidthMul
                ? {maxWidth: calc(controlHeightLG).mul(maxWidthMul).equal()}
                : {}),
        },
    }
}

export function genCoverImageStyle(
    token: LoncraStyleToken,
    options: {includeImg?: boolean; objectPosition?: string} = {},
): CSSObject {
    const {antCls} = token
    const selectors = [
        options.includeImg ? 'img' : '',
        `${antCls}-image`,
        `${antCls}-image-img`,
    ].filter(Boolean)
    return {
        [selectors.join(', ')]: {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            ...(options.objectPosition ? {objectPosition: options.objectPosition} : {}),
        },
    }
}

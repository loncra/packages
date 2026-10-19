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

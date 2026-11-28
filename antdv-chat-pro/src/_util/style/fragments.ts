import type {CSSObject} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'

export function genFilePaneChromeStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls} = token
  return {
    [`${componentCls}-pane`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
    [`${componentCls}-editor`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    ...genFullSpinStyle(token),
  }
}

export function genToneColorStyle(token: LoncraStyleToken): CSSObject {
  const {colorPrimary, colorSuccess, colorWarning, colorError, colorTextSecondary} = token
  return {
    '&-primary': {color: colorPrimary},
    '&-success': {color: colorSuccess},
    '&-warning': {color: colorWarning},
    '&-error': {color: colorError},
    '&-secondary': {color: colorTextSecondary},
  }
}

export function genEmptyAreaStyle(): CSSObject {
  return {
    display: 'flex',
    width: '100%',
    height: '100%',
    minHeight: 0,
  }
}

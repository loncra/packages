import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'

export function genDragStyle(token: LoncraStyleToken, componentCls: string): CSSObject {
  const {antCls, colorInfoBg} = token
  const insetShadow = (offset: string) => `inset ${offset} ${colorInfoBg}`

  return {
    [`${componentCls}-drag-handle`]: {
      textAlign: 'center',
      cursor: 'grab',
    },

    [`${antCls}-table-tbody > tr${componentCls}-drag-row-invalid`]: {
      cursor: 'not-allowed',
    },
    [`${antCls}-table-tbody > tr${componentCls}-drag-row-before > td`]: {
      boxShadow: insetShadow('0 2px 0 0'),
    },
    [`${antCls}-table-tbody > tr${componentCls}-drag-row-after > td`]: {
      boxShadow: insetShadow('0 -2px 0 0'),
    },
    [`${antCls}-table-tbody > tr${componentCls}-drag-row-inner > td`]: {
      background: `color-mix(in srgb, ${colorInfoBg} 35%, transparent)`,
    },

    [`${componentCls}-drag-card-before`]: {boxShadow: insetShadow('0 2px 0 0')},
    [`${componentCls}-drag-card-after`]: {boxShadow: insetShadow('0 -2px 0 0')},
    [`${componentCls}-drag-card-left`]: {boxShadow: insetShadow('2px 0 0 0')},
    [`${componentCls}-drag-card-right`]: {boxShadow: insetShadow('-2px 0 0 0')},
  }
}

export function genDragGhostStyle(token: LoncraStyleToken, componentCls: string): CSSObject {
  const {
    borderRadius,
    colorBgContainer,
    colorBorder,
    colorText,
    fontSize,
    lineWidth,
    padding,
    paddingXS,
  } = token

  return {
    [`${componentCls}-drag-ghost`]: {
      position: 'fixed',
      insetInlineStart: '-9999px',
      zIndex: 9999,
      pointerEvents: 'none',
      padding: paddingXS,
      paddingInline: padding,
      borderRadius,
      border: `${lineWidth} dashed ${colorBorder}`,
      background: colorBgContainer,
      color: colorText,
      fontSize,
    },
  }
}

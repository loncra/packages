import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoneraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genIconSelectStyle(token: LoneraStyleToken): CSSInterpolation {
  const { componentCls } = token
  const controlHeightLG = Number(token.controlHeightLG ?? 40)
  const fontSizeXL = Number(token.fontSizeXL ?? 20)
  const marginXS = Number(token.marginXS ?? 8)

  return {
    [componentCls]: {
      [`&-preview`]: {
        position: 'relative',
        display: 'inline-block',
      },
      [`${componentCls}-tabs-body`]: {
        overflow: 'auto',
        maxHeight: controlHeightLG * 8,
      },
      [`${componentCls}-popover-body`]: {
        overflow: 'auto',
        maxHeight: controlHeightLG * 4,
        maxWidth: controlHeightLG * 10,
      },
      [`${componentCls}-glyph`]: {
        fontSize: fontSizeXL,
      },
      [`${componentCls}-avatar`]: {
        width: '100%',
      },
      [`${componentCls}-compact`]: {
        flex: 1,
      },
      [`${componentCls}-select`]: {
        width: 'auto',
      },
      [`${componentCls}-search`]: {
        width: controlHeightLG * 3,
      },
      [`${componentCls}-payload`]: {
        width: '100%',
      },
    },
    [`${componentCls}-avatar`]: {
      width: '100%',
      gap: marginXS,
    },
  } as CSSInterpolation
}

export default genStyleHooks('IconSelect', genIconSelectStyle)

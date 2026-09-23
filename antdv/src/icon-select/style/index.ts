import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genIconSelectStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, controlHeightLG, fontSizeXL, marginXS, paddingMD, calc} = token

  return {
    [componentCls]: {
      [`&-preview`]: {
        position: 'relative',
        display: 'inline-block',
      },
      [`${componentCls}-compact`]: {
        flex: 1,
      },
      [`${componentCls}-select`]: {
        width: 'auto',
      },
      [`${componentCls}-payload`]: {
        width: '100%',
      },
      [`${antCls}-tabs-nav`]: {
        margin: 0
      },
      [`${antCls}-tabs-body`]: {
        margin: 0,
        paddingTop: paddingMD
      }
    },
    [`${componentCls}-avatar`]: {
      width: '100%',
      gap: marginXS,
    },
    [`${componentCls}-tabs-body`]: {
      overflow: 'auto',
      maxHeight: calc(controlHeightLG).mul(8).equal(),
    },
    [`${componentCls}-popover-body`]: {
      overflow: 'auto',
      maxHeight: calc(controlHeightLG).mul(4).equal(),
      maxWidth: calc(controlHeightLG).mul(10).equal(),
    },
    [`${componentCls}-glyph`]: {
      fontSize: fontSizeXL,
    },
    [`${componentCls}-search`]: {
      width: calc(controlHeightLG).mul(3).equal(),
    },
  }
}

export default genStyleHooks('IconSelect', genIconSelectStyle, {order: 0})

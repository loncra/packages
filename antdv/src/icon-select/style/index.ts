import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genIconSelectStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, controlHeightLG, fontSizeXL, marginXS, paddingMD, calc} = token

  return {
    [componentCls]: {
      [`&-preview`]: {
        position: 'relative',
        display: 'inline-block',
      },
      [`&-compact`]: {
        flex: 1,
      },
      [`&-select`]: {
        width: 'auto',
      },
      [`&-payload`]: {
        width: '100%',
      },
      [`&-search`]: {
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
  }
}

export default genStyleHooks('IconSelect', genIconSelectStyle, {order: 1})

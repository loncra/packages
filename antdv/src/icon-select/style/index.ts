import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '../../_util/genStyleLayer'
import {genScrollAreaStyle} from '../../_util/style/fragments'

function genIconSelectStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, fontSizeXL, marginXS, paddingMD} = token

  return {
    [componentCls]: {
      [`&-preview`]: {
        position: 'relative',
        display: 'inline-block',
      },
      [`&-avatar`]: {
        width: '100%',
        [`${antCls}-flex`]: {
          gap: marginXS,
        },
      },
      [`&-compact`]: {
        flex: 1,
        width: '100%',
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
      [`&-popover-search`]: {
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
    ...genScrollAreaStyle(token, '-tabs-body', 8),
    ...genScrollAreaStyle(token, '-popover-body', 4, 10),
    [`${componentCls}-glyph`]: {
      fontSize: fontSizeXL,
    },
  }
}

export default genStyleHooks('IconSelect', genIconSelectStyle, {order: 1})

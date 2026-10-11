import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

function genImSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingXS, lineWidth, lineType, colorBorderSecondary, colorBgLayout, borderRadiusLG} =
    token

  return {
    [`${componentCls}-references`]: {
      width: '100%',
      padding: paddingXS,
      background: colorBgLayout,
      borderBottom: `${unit(lineWidth)} ${lineType} ${colorBorderSecondary}`,
      borderTopLeftRadius: borderRadiusLG,
      borderTopRightRadius: borderRadiusLG,
      [`${componentCls}-reference`]: {
        display: 'contents',
      },
      [`${componentCls}-chip`]: {
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '20rem',
      },
      [`${componentCls}-chip-body`]: {
        minWidth: 0,
        maxWidth: '100%',
        flex: '1 1 0%',
        overflow: 'hidden',
      },
      [`${componentCls}-chip-name`]: {
        flexShrink: 0,
      },
      [`${componentCls}-chip-preview`]: {
        minWidth: 0,
        flex: '1 1 0%',
      },
    },
  }
}

export default genStyleHooks('ImSender', genImSenderStyle, {order: 1})

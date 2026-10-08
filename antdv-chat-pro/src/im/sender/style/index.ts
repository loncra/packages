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
    },
    [`${componentCls}-reference`]: {
      display: 'contents',
    },
  }
}

export default genStyleHooks('ImSender', genImSenderStyle, {order: 1})

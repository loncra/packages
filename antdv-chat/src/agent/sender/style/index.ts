import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

function genAgentSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, controlHeight, calc} = token

  return {
    [`${componentCls}-catalog`]: {
      minWidth: calc(controlHeight).mul(5.5).equal(),
      border: 'none !important',
      background: 'transparent !important',
    },
  }
}

export default genStyleHooks('AgentSender', genAgentSenderStyle, {order: 1})

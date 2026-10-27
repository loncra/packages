import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genAgentSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, controlHeight, calc, antCls} = token

  return {
    [`${componentCls}-catalog`]: {
      minWidth: calc(controlHeight).mul(5.5).equal(),
      border: 'none',
      background: 'transparent',
      [`${antCls}-menu-item`]: {
        display:'flex',
        alignItems: 'center',
      }
    },
  }
}

export default genStyleHooks('AgentSender', genAgentSenderStyle, {order: 4})

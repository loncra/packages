import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../../_util/genStyleLayer'
import {genStyleHooks} from '../../../_util/genStyleLayer'

function genAgentSenderStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, controlHeight, calc} = token

  return {
    [`${componentCls}-catalog`]: {
      minWidth: calc(controlHeight).mul(5.5).equal(),
      border: 'none',
      background: 'transparent',
    },
  }
}

export default genStyleHooks('AgentSender', genAgentSenderStyle, {order: 4})

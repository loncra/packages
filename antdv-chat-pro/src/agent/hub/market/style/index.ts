import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../../_util/genStyleLayer'
import {genEmptyAreaStyle} from '../../../../_util/style/fragments'

export const AGENT_HUB_MARKET_PREFIX = 'loncra-agent-hub-market'

function genAgentHubMarketStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, padding, antCls} = token
  return {
    [`${componentCls}-tabs`]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      [`${antCls}-tabs-tab`]: {
        margin: 0,
        [`.anticon:not(:last-child)`]: {
          marginRight:0
        }
      }
    },
    [`${componentCls}-tabs-body`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-tabs-content`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      padding: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-scroll`]: {
      flex: '1 1 auto',
      width: '100%',
      minHeight: 0,
      padding,
      overflowY: 'auto',
    },
    [`${componentCls}-empty`]: genEmptyAreaStyle(),
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('AgentHubMarket', genAgentHubMarketStyle, {order: 4})

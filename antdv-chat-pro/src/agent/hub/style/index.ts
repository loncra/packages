import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

export const AGENT_HUB_PREFIX = 'loncra-agent-hub'

function genAgentHubStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginSM, padding} = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      [`${componentCls}-switch`]: {
        flexShrink: 0,
        padding,
        textAlign: 'center',
      },
      [`${componentCls}-divider`]: {
        flexShrink: 0,
        marginTop: marginSM,
        marginBottom: 0,
      },
      [`${componentCls}-body`]: {
        flex: '1 1 0',
        minHeight: 0,
        overflow: 'hidden',
      },
    },
  }
}

export default genStyleHooks('AgentHub', genAgentHubStyle, {order: 4})

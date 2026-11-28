import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../../_util/genStyleLayer'
import {genEmptyAreaStyle} from '../../../../_util/style/fragments'

export const AGENT_HUB_CARD_PREFIX = 'loncra-agent-hub-card'

function genAgentHubCardStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, fontSizeSM, padding} = token
  return {
    [componentCls]: {
      [`${componentCls}-card-body`]: {
        padding,
      },
      [`${componentCls}-time`]: {
        fontSize: fontSizeSM,
      },
      [`${componentCls}-summary`]: {
        width: '100%',
        maxHeight: 120,
        overflow: 'auto',
      },
      [`${componentCls}-scroll`]: {
        flex: '1 1 auto',
        width: '100%',
        minHeight: 0,
        padding,
        overflowY: 'auto',
      },
      [`${componentCls}-empty`]: genEmptyAreaStyle(),
    }
  }
}

export default genStyleHooks('AgentHubCard', genAgentHubCardStyle, {order: 4})

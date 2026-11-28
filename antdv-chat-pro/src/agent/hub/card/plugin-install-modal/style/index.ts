import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../../../_util/genStyleLayer'
import {genToneColorStyle} from '../../../../../_util/style/fragments'

export const AGENT_HUB_INSTALL_PREFIX = 'loncra-agent-hub-install'

function genAgentHubInstallStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls} = token
  return {
    [componentCls]: {
      ...genToneColorStyle(token),
    },
    [`${componentCls}-main`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-checkbox`]: {
      width: '100%',
    },
    [`${componentCls}-label`]: {
      flex: 1,
      minWidth: 0,
      [`${antCls}-typography`]: {
        flex: 1,
      },
    },
  }
}

export default genStyleHooks('AgentHubInstall', genAgentHubInstallStyle, {order: 4})

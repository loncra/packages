import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../../../_util/genStyleLayer'

function genAgentHubChangelogStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorBorderSecondary, fontSizeSM, padding, paddingXS, paddingXXS} = token
  return {
    [`${componentCls}-changelog`]: {
      borderTop: `1px solid ${colorBorderSecondary}`,
      borderRadius: 0,
      paddingTop: paddingXS,
      [`${antCls}-collapse-header`]: {
        padding: 0
      },
      [`${antCls}-collapse-body`]: {
        padding: `${padding} 0`
      }
    },
    [`${componentCls}-changelog-content`]: {
      whiteSpace: 'pre-wrap',
    },
    [`${componentCls}-release-change-log-tabs-item`]: {
      padding: `${paddingXXS} ${paddingXS}`,
    },
    [`${componentCls}-time`]: {
      fontSize: fontSizeSM,
    },
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('AgentHubChangelog', genAgentHubChangelogStyle, {order: 4})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'

export const AGENT_HUB_PREFIX = 'loncra-agent-hub'

function genAgentHubStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginSM,antCls, padding, paddingXXS, fontSizeSM, colorBorderSecondary} = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      [`${componentCls}-switch`]: {
        flexShrink: 0,
        padding:padding,
        textAlign: 'center',
      },
      [`${componentCls}-divider`]: {
        flexShrink: 0,
        marginTop:marginSM,
        marginBottom: 0,
      },
      [`${componentCls}-body`]: {
        flex: '1 1 0',
        minHeight: 0,
        overflow: 'hidden',
      },
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
      [`${componentCls}-empty`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
      [`${componentCls}-summary`]: {
        width: '100%',
        maxHeight: 120,
        overflow: 'auto',
      },
      [`${componentCls}-time`]: {
        fontSize: fontSizeSM,
      },
      [`${componentCls}-changelog`]: {
        borderTop: `1px solid ${colorBorderSecondary}`,
        borderRadius: 0,
        paddingTop:paddingXXS,
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
    },
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('AgentHub', genAgentHubStyle, {order: 4})

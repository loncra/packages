import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../../_util/genStyleLayer'
import {genToneColorStyle} from '../../../_util/style/fragments'

export const AGENT_HUB_PREFIX = 'loncra-agent-hub'

function genAgentHubStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginSM,antCls, padding, paddingXS, paddingXXS, fontSizeSM, colorBorderSecondary} = token
  return {
    [`${componentCls}-changelog`]: {
      borderTop: `1px solid ${colorBorderSecondary}`,
      borderRadius: 0,
      paddingTop:paddingXS,
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
      padding:`${paddingXXS} ${paddingXS}`,
    },
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
      ...genToneColorStyle(token),
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
      [`${componentCls}-card-body`]: {
        padding:padding,
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

    },
    [`${componentCls}-install-main`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-install-checkbox`]: {
      width: '100%',
    },
    [`${componentCls}-install-label`]: {
      flex: 1,
      minWidth: 0,
      [`${antCls}-typography`]: {
        flex: 1,
      },
    },
    [`${componentCls}-version-select`]: {
      width: 'auto',
    },
    /*[`${componentCls}-version-split`]: {
      width: 30,
      textAlign: 'center',
      borderInlineStart: 0,
      borderInlineEnd: 0,
      pointerEvents: 'none',
    },*/
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('AgentHub', genAgentHubStyle, {order: 4})

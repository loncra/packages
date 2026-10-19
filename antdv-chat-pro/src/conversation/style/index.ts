import type {CSSInterpolation, CSSObject} from '@antdv-next/cssinjs'
import {genFullSpinStyle, type LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'

export const CONVERSATION_LIST_PREFIX = 'loncra-conversation-list'

function genConversationListStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorText, colorTextSecondary, colorBgTextActive, fontSizeSM, motionDurationMid, lineHeight, paddingXS, marginXS} = token
  const row: CSSObject = {
    height: 'auto',
    minHeight: 0,
    lineHeight,
    overflow: 'visible',
    borderRadius: 0,
    width: '100%',
    marginBlock: 0,
    marginInline: 0,
    paddingBlock: paddingXS,
    paddingInline: paddingXS,
    alignItems: 'center',
  }
  return {
    [componentCls]: {
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      [`${componentCls}-body`]: {
        flex: '1 1 0',
        minHeight: 0,
        overflow: 'auto',
      },
      [`${componentCls}-empty`]: {
        width: '100%',
        height: '100%',
      },
      [`${componentCls}-menu`]: {
        background: 'transparent',
        borderInlineEnd: 'none',
        [`${componentCls}-item`]: {
          ...row,
          '&::after': {
            content: 'none',
            borderInlineEnd: 'none',
          },
        },
        [`${antCls}-menu-item-selected, ${antCls}-menu-item-active`]: {
          color: colorText,
          backgroundColor: colorBgTextActive,
        },
        [`${antCls}-menu-sub`]: {
          backgroundColor: 'transparent',
        },
        [`${antCls}-menu-submenu-title`]: {
          ...row,
          [`${antCls}-menu-submenu-arrow`]: {
            textAlign:'center'
          }
        },
      },
      [`${componentCls}-line`]: {
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        width: '100%',
        lineHeight,
      },
      [`${componentCls}-name`]: {
        flex: 1,
        minWidth: 0,
      },
      [`${componentCls}-side`]: {
        display: 'grid',
        flexShrink: 0,
        justifyItems: 'end',
        alignItems: 'center',
        marginInlineStart: marginXS,
      },
      [`${componentCls}-time, ${componentCls}-actions`]: {
        gridArea: '1 / 1',
      },
      [`${componentCls}-time`]: {
        color: colorTextSecondary,
        fontSize: fontSizeSM,
        whiteSpace: 'nowrap',
        transition: `opacity ${motionDurationMid}`,
      },
      [`${componentCls}-actions`]: {
        opacity: 0,
        pointerEvents: 'none',
        transition: `opacity ${motionDurationMid}`,
        [`${antCls}-btn`]: {
          margin: 0,
        },
      },
      [`${componentCls}-item:hover ${componentCls}-time, ${componentCls}-menu ${antCls}-menu-submenu-title:hover ${antCls}-menu-submenu-arrow`]: {
        opacity: 0,
      },
      [`${componentCls}-item:hover ${componentCls}-actions, ${componentCls}-menu ${antCls}-menu-submenu-title:hover ${componentCls}-actions`]: {
        opacity: 1,
        pointerEvents: 'auto',
      },
      [`${componentCls}-subtitle`]: {
        minWidth: 0,
        margin: 0,
        lineHeight,
      },
    },
    ...genFullSpinStyle(token),
  }
}

export default genStyleHooks('ConversationList', genConversationListStyle, {order: 4})

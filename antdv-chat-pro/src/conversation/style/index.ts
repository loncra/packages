import type {CSSInterpolation, CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

export const CONVERSATION_LIST_PREFIX = 'loncra-conversation-list'

function genConversationListStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, colorTextSecondary, fontSizeSM, motionDurationMid, lineHeight, paddingXS, paddingSM, marginXS} = token
  const menuCls = `${antCls}-menu`
  // 菜单行高写在 antd 的 inline 规则里，后注册且带自身 hash。classes 只负责把类挂上去，
  // 这里用菜单根上的双类把特异性抬过那条 height/line-height，避免再在 tsx 里写 styles。
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
  const title: CSSObject = {
    overflow: 'visible',
    whiteSpace: 'normal',
    textOverflow: 'clip',
    lineHeight,
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
      [`${componentCls}-menu`]: {
        background: 'transparent',
        [`&${menuCls}-root${menuCls}-inline`]: {
          borderInlineEnd: 'none',
        },
        [`&${menuCls}-inline`]: {
          [`
            ${menuCls}-item::after,
            ${menuCls}-item:hover::after,
            ${menuCls}-item-active::after,
            ${menuCls}-item-selected::after
          `]: {
            content: 'none',
            borderInlineEnd: 'none',
          },
          [`
            > ${menuCls}-item${componentCls}-item,
            ${menuCls}-item${componentCls}-item
          `]: {
            ...row,
            paddingInline: paddingSM,
          },
          [`
            > ${menuCls}-submenu > ${menuCls}-submenu-title,
            ${menuCls}-submenu-title
          `]: row,
          [`${menuCls}-title-content${componentCls}-item-content, ${menuCls}-submenu-title > ${menuCls}-title-content`]: title,
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
        alignItems: 'center',
        justifyItems: 'end',
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
      [`${componentCls}-row:hover ${componentCls}-time`]: {
        opacity: 0,
      },
      [`${componentCls}-row:hover ${componentCls}-actions`]: {
        opacity: 1,
        pointerEvents: 'auto',
      },
      [`${componentCls}-subtitle`]: {
        minWidth: 0,
        margin: 0,
        lineHeight,
      },
    },
  }
}

export default genStyleHooks('ConversationList', genConversationListStyle, {order: 1})

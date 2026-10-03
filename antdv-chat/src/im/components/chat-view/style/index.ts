import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 消息区（右栏）的默认样式。
 *
 * 两块内容：
 * 1. **结构**：撑满 + 纵向排列（宿主模板里是 `a-flex vertical class="h-full min-h-0 overflow-hidden"`）；
 * 2. **气泡外观**：宿主 `constants/chatConstant.ts` 的 `DEFAULT_BUBBLE_LIST_ROLE` 里那几处 Tailwind
 *    落成 token（宿主的 role 常量**留宿主** —— `packages/**` 不带 Tailwind，见 `bubble-list` 的说明）。
 */
function genImChatViewStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    marginXS,
    fontSizeSM,
    paddingSM,
    paddingXS,
    colorPrimaryBg,
    colorTextSecondary,
    colorBgLayout,
    colorBorderSecondary,
    borderRadiusLG,
  } = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1 1 0',
      minWidth: 0,
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',

      // 未选中会话时的空态（宿主 `a-flex v-else justify=center align=center` + `a-empty`）
      [`${componentCls}-empty`]: {
        flex: '1 1 0',
        width: '100%',
        minHeight: 0,
      },

      // 主体：气泡列表 + 发送器（宿主是 `<l-chat-bubble-list/>` + `<div class="shrink-0 …">`）
      [`${componentCls}-body`]: {
        flex: '1 1 0',
        minWidth: 0,
        minHeight: 0,
      },

      // 发送器外壳（宿主 `shrink-0 p-sm border-t border-t-border-secondary`）
      [`${componentCls}-sender`]: {
        flex: '0 0 auto',
        padding: paddingSM,
        borderBlockStart: `1px solid ${colorBorderSecondary}`,
      },

      // 引用区（宿主 `w-full p-xs bg-layout border-b border-b-border-secondary rounded-t-xl`）
      [`${componentCls}-reference`]: {
        width: '100%',
        padding: paddingXS,
        background: colorBgLayout,
        borderBlockEnd: `1px solid ${colorBorderSecondary}`,
        borderStartStartRadius: borderRadiusLG,
        borderStartEndRadius: borderRadiusLG,
      },

      // ── 气泡外观（宿主 `DEFAULT_BUBBLE_LIST_ROLE` → token） ──
      //
      // ⚠️ 每个值**都必须 `!important`**：宿主那三个 `classes` 里的 Tailwind 值**全都带 `!`**
      // （`bg-primary-bg!` / `text-text-secondary!` / `text-xs! font-normal! my-xs!`）
      // —— 因为 x 的 `.antd-bubble-content` 等规则与我们的**同特异性**、且它后注册（后注册赢）。
      // 2026-10-03 移植时漏了 `!` ⇒ **自己发的气泡丢了淡蓝底**（用户报障）。
      /** `user.classes.content = 'bg-primary-bg!'` */
      [`${componentCls}-role-user-content`]: {
        background: `${colorPrimaryBg} !important`,
      },
      /** `system.classes.content = 'text-text-secondary!'` */
      [`${componentCls}-role-system-content`]: {
        color: `${colorTextSecondary} !important`,
      },
      /** `divider.dividerProps.classes.content/root = 'text-text-secondary! text-xs! font-normal! my-xs!'` */
      [`${componentCls}-divider`]: {
        color: `${colorTextSecondary} !important`,
        fontSize: `${fontSizeSM} !important`,
        fontWeight: 'normal !important',
        marginBlock: `${marginXS} !important`,
      },
    },
  }
}

export default genStyleHooks('ImChatView', genImChatViewStyle)

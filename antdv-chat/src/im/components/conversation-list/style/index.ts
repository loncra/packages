import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '@loncra/antdv'

/**
 * 会话列表（左栏）的默认样式。
 *
 * 原宿主模板里这几处 Tailwind 落成 token（2026-10-03 Step 3）：
 * - 根 `h-full min-h-0 overflow-hidden` + `a-flex vertical` ⇒ 结构与静态值；
 * - 搜索区 `shrink-0 p-sm` ⇒ `paddingSM`；
 * - 列表 `min-h-0 size-full flex-[1_1_0] p-0! gap-0!` ⇒ 自适应（`flex: 1 1 0`）；
 * - 列表项 `p-xs! h-auto! min-h-auto! rounded-none!` ⇒ `-item`（宿主 x 组件通过 `classes.item` 接收）。
 *
 * ⚠️ 包内**只出默认、不封死**：宿主可传 `class` / `style`（透传），x 的 `classes` 也走这里的类名。
 */
function genConversationListStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    paddingSM,
    paddingXS,
    paddingXXS,
    fontSize,
    colorWarning,
    colorWarningBorder,
    colorBgElevated,
    colorBorder,
    colorError,
    colorWhite,
  } = token
  return {
    [componentCls]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',

      // 搜索区（原 `shrink-0 p-sm`）
      [`${componentCls}-search`]: {
        flex: '0 0 auto',
        padding: paddingSM,
      },

      /**
       * 列表本体（原 `min-h-0 size-full flex-[1_1_0] p-0! gap-0!`）。
       *
       * ⚠️ `padding: 0` / `gap: 0` 是在**抵消 x 自己的根样式**（`.antd-conversations` 给了
       * `padding: paddingSM` + `gap: paddingXXS`）—— 每一项自己已经有内边距；宿主当年也是 `p-0! gap-0!`
       * 压掉的，故这里同样带 `!important`（x 的样式在平局时后注入、会赢）。
       */
      [`${componentCls}-list`]: {
        flex: '1 1 0',
        minHeight: 0,
        width: '100%',
        padding: '0 !important',
        gap: '0 !important',
      },

      /**
       * 列表项（原 `:classes="{item:'p-xs! h-auto! min-h-auto! rounded-none!'}"`）。
       *
       * ⚠️ 四个值**都带 `!important`**：x 的 `.antd-conversations .antd-conversations-item` 固定了
       * `height/min-height = controlHeightLG`（40px）且**平局时后注入、会赢** ⇒ 不加 `!` 时两行内容
       * （实测 44px）会被压回 40px。宿主当年每个值也都带 `!`。
       */
      [`${componentCls}-item`]: {
        padding: `${paddingXS} !important`,
        height: 'auto !important',
        minHeight: 'auto !important',
        borderRadius: '0 !important',
      },

      // 空态（原 `a-flex justify=center align=center class="size-full"`）
      [`${componentCls}-empty`]: {
        flex: '1 1 0',
        width: '100%',
        minHeight: 0,
      },

      /**
       * 封面头像组（宿主 Tailwind `[&>*:not(:first-child)]:-ms-8!` = -2rem）
       * ⇒ 非首个头像向左叠放（`-ms-8` 是逻辑属性 `margin-inline-start`，故用 `marginInlineStart`）。
       */
      [`${componentCls}-avatar-group`]: {
        [`& > *:not(:first-child)`]: {
          // ⚠️ `!important`：宿主原文是 `-ms-8!`（Tailwind 带 `!`）
          marginInlineStart: `${token.calc(token.margin).mul(-2).equal()} !important`,
        },
      },

      /**
       * 头像容器（宿主 `a-flex justify=center align=center class="h-full relative"`）——
       * 也是两个角标（置顶/免打扰）的定位参照。
       */
      [`${componentCls}-icon`]: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      },

      /** 免打扰：整块淡化（宿主那个三元 `opacity-80`） */
      [`${componentCls}-icon-muted`]: {
        opacity: 0.8,
      },

      /**
       * 置顶标（宿主 Tailwind：`absolute top-0 left-0 pl-xxs pr-xxs opacity-80
       * border border-solid border-warning-border bg-warning rounded-full` + 图标 `text-md text-white`）。
       *
       * `top-0 left-0` 落成**逻辑**定位（`insetBlockStart/insetInlineStart`），与宿主用 `-ms-*` 的口径一致。
       */
      [`${componentCls}-mark-pinned`]: {
        position: 'absolute',
        insetBlockStart: 0,
        insetInlineStart: 0,
        paddingInline: paddingXXS,
        opacity: 0.8,
        border: `1px solid ${colorWarningBorder}`,
        background: colorWarning,
        borderRadius: '50%',
        color: colorWhite,
        fontSize,
      },

      /**
       * 免打扰标（宿主 Tailwind：`absolute bottom-0 left-0 pl-xxs pr-xxs border border-dashed
       * opacity-80 bg-elevated rounded-full` + 图标 `text-md text-error`；有人 `@我` 时换图标、不换样式）。
       */
      [`${componentCls}-mark-muted`]: {
        position: 'absolute',
        insetBlockEnd: 0,
        insetInlineStart: 0,
        paddingInline: paddingXXS,
        opacity: 0.8,
        border: `1px dashed ${colorBorder}`,
        background: colorBgElevated,
        borderRadius: '50%',
        color: colorError,
        fontSize,
      },

      // 名字 + 时间那一行
      [`${componentCls}-title`]: {
        display: 'flex',
        gap: token.marginXS,
        alignItems: 'center',
      },
      [`${componentCls}-title-name`]: {
        flex: '1 1 0',
        minWidth: 0,
      },
      [`${componentCls}-title-time`]: {
        flex: '0 0 auto',
      },
    },
  }
}

export default genStyleHooks('ConversationList', genConversationListStyle)

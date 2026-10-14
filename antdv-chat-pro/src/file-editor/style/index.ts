import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {Keyframes, unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genFileEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {
    componentCls,
    prefixCls,
    colorBorderSecondary,
    colorBgContainer,
    colorBgLayout,
    colorTextSecondary,
    borderRadiusLG,
    paddingXS,
    paddingSM,
    marginXS,
    controlHeightSM,
    lineWidth,
    lineType,
    antCls,
    motionDurationMid,
    motionDurationSlow,
    calc,
  } = token

  /**
   * 树节点「加载中」图标的旋转动画。
   *
   * ⚠️ **必须用 `Keyframes` 类，不能写成普通对象的 `'@keyframes xxx'`**（2026-09-30 读 cssinjs 源码确认）：
   * `parseStyle` 只把带 `_keyframe` 的 `Keyframes` **实例**交给 `parseKeyframes`
   * （`@antdv-next/cssinjs` 的 `useStyleRegister.js:45-54`）⇒ `to` / `from` 保持原样；
   * 而普通对象那条路会给**子选择器注入 hashId**（同文件 `:74-76` 的 `injectSelectorHash`）⇒
   * 生成 `to:where(.css-xxx)` —— **不是合法的 keyframe 选择器** ⇒ 关键帧被浏览器整段丢掉、
   * **动画静默失效**（不报错，只是不转）。这与有没有 tailwindcss 无关（产物是纯 CSS）。
   *
   * 名字用 `token.prefixCls`（**不带点的那个前缀**）—— antd 自己的 `carousel/style` 就是
   * `new Keyframes(\`${token.prefixCls}-dot-animation\`, …)` ⇒ 照抄这个口径：跟随 `getPrefixCls`
   * （ConfigProvider / `prefixCls` prop 换前缀时名字跟着变），也不再硬编码 `loncra-file-editor`。
   * 放在**函数内**同样是跟 antd 一致：模块级拿不到 token（那时 `prefixCls` 还不存在）。
   */
  const spinKeyframes = new Keyframes(`${prefixCls}-spin`, {
    to: {transform: 'rotate(360deg)'},
  })

  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      minHeight: '30rem',
      height: '30rem',
      maxHeight: '45rem',
      overflow: 'hidden',
      flexDirection: 'column',
      [`${antCls}-splitter`]: {
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      },
      [`${antCls}-splitter ${antCls}-splitter-panel`]: {
        minHeight: 0,
        overflow: 'hidden',
        padding: 0,
      },
      [`${componentCls}-menu`]: {
        border: 'none',
        [`&${antCls}-menu-light${antCls}-menu-root${antCls}-menu-inline, &${antCls}-menu-light${antCls}-menu-root${antCls}-menu-vertical, &${antCls}-menu-dark${antCls}-menu-root${antCls}-menu-inline, &${antCls}-menu-dark${antCls}-menu-root${antCls}-menu-vertical`]:
          {
            borderBottom: 0,
            borderInlineEnd: 0,
          },
        [`${antCls}-menu-inline, ${antCls}-menu-horizontal`]: {
          borderBottom: 0,
          borderInlineEnd: 0,
        },
        [`&${antCls}-menu-light${antCls}-menu-inline ${antCls}-menu-sub${antCls}-menu-inline, &${antCls}-menu-dark${antCls}-menu-inline ${antCls}-menu-sub${antCls}-menu-inline`]:
          {
            background: colorBgContainer,
          },
        [`${antCls}-menu-submenu > ${antCls}-menu`]: {
          backgroundColor: colorBgContainer,
        },
        [`&${antCls}-menu-inline ${antCls}-menu-item, &${antCls}-menu-inline ${antCls}-menu-submenu-title`]:
          {
            height: 32,
            lineHeight: '32px',
            marginBottom: 0,
            paddingInlineEnd: paddingXS,
          },
        [`${antCls}-menu-sub${antCls}-menu-inline > ${antCls}-menu-submenu > ${antCls}-menu-submenu-title`]:
          {
            height: 32,
            lineHeight: '32px',
            marginBottom: 0,
            paddingInlineEnd: paddingXS,
          },
      },
    },
    [`${componentCls}-hidden-upload`]: {
      display: 'none',
    },
    [`${componentCls}-splitter`]: {
      borderRadius: borderRadiusLG,
      border: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-panel`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
    [`${componentCls}-panel-main`]: {
      minHeight: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
    [`${componentCls}-side`]: {
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
    [`${componentCls}-toolbar`]: {
      width: '100%',
      flexShrink: 0,
      padding: paddingXS,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-tree`]: {
      minHeight: 0,
      flex: 1,
      overflowY: 'auto',
    },
    [`${componentCls}-spin`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      [`&${antCls}-spin, &${antCls}-spin-nested-loading`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
      },
      [`${antCls}-spin-container`]: {
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
      },
      [`&${antCls}-spin-nested-loading > div > ${antCls}-spin`]: {
        maxHeight: 'none',
        height: '100%',
      },
    },
    [`${componentCls}-grow`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-row`]: {
      minWidth: 0,
      width: '100%',
    },
    [`${componentCls}-more`]: {
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    [`${componentCls}-more-btn`]: {
      position: 'absolute',
      opacity: 0,
      transition: `opacity ${motionDurationMid}`,
    },
    [`${componentCls}-row:hover ${componentCls}-more-btn`]: {
      position: 'static',
      opacity: 1,
    },
    [`${componentCls}-tabs`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
    },
    [`${componentCls}-tabs-root`]: {
      minHeight: 0,
      height: '100%',
    },
    [`${componentCls}-tabs-body`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
    },
    [`${componentCls}-tabs-content`]: {
      minHeight: 0,
      height: '100%',
    },
    [`${componentCls}-tab-item`]: {
      // `-tab-close` 以它（= `.ant-tabs-tab`，antd 自己也是 relative）为定位基准
      position: 'relative',
      // 下面两个 `!important` 是**必要**的：antd 的 `.ant-tabs-tab`（0,2,0）与
      // `.ant-tabs-tab + .ant-tabs-tab`（0,3,0）都压在只写语义类的这条（0,1,0）上面
      padding: `${calc(paddingXS).add(1.5).equal()} ${unit(paddingSM)} !important`,
    },
    /**
     * 选项卡之间的默认间距清零（antd 在 `.ant-tabs .ant-tabs-tab + .ant-tabs-tab` 上给了
     * `margin: 0 0 0 var(--ant-tabs-horizontal-item-gutter)`）。
     *
     * ⚠️ 两点都不能省（2026-09-30 实测）：
     * ① **必须写在顶层** —— 写在上面的 `-tab-item` 里会生成
     *    `.loncra-file-editor-tab-item .ant-tabs .ant-tabs-tab + .ant-tabs-tab`：`-tab-item` 自己
     *    **就是** `.ant-tabs-tab`，`.ant-tabs` 是它的**祖先** ⇒ 后代选择器永不匹配 ✗；
     * ② **必须 `!important`** —— 与 antd 那条**同选择器、同特异性**，而本仓样式住在 `@layer antd`
     *    ⇒ cssinjs 的 `prepend` 被关成 `false` ⇒ `order` 不参与插入排序，打平一律"后注册的赢"
     *    （antd 组件是子组件、后注册）⇒ 只能 `!important`（依据详见 `basic-crud-query/style/index.ts`）。
     */
    [`${antCls}-tabs ${antCls}-tabs-tab + ${antCls}-tabs-tab`]: {
      margin: '0 !important',
    },
    [`${componentCls}-tab-header`]: {
      paddingInlineEnd: paddingXS,
      // 与上面 `-tab-item` 那两处同理：要压的 antd 规则比本选择器**更具体** ⇒ `!important` 留着
      marginBottom: `0 !important`,
    },
    [`${componentCls}-tab-label`]: {
      overflow: 'hidden',
    },
    [`${componentCls}-tab-close`]: {
      position: 'absolute',
      insetInlineEnd: 0,
      top: '50%',
      zIndex: 1,
      transform: 'translateY(-50%)',
      background: colorBgContainer,
      opacity: 0,
      color: colorTextSecondary,
      // 淡入淡出，别"闪"（hover 判定在 `-tab-item` 上，见下一条）
      transition: `opacity ${motionDurationMid}`,
      [`&${antCls}-btn`]: {
        background: colorBgContainer,
      },
    },
    [`${componentCls}-tab-item:hover ${componentCls}-tab-close`]: {
      opacity: 1,
      [`&${antCls}-btn, &${antCls}-btn:hover, &${antCls}-btn:active`]: {
        background: colorBgContainer,
        boxShadow: 'none',
      },
    },
    [`${componentCls}-icon-spin`]: {
      marginBottom: 3,
      // 给 `Keyframes` **实例**（不是字符串）：cssinjs 会换成 `getName(hashId)`（带 hashId，不撞车）
      animationName: spinKeyframes,
      animationDuration: motionDurationSlow,
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
    },
    [`${componentCls}-pane`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
    [`${componentCls}-media`]: {
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: paddingXS,
    },
    [`${componentCls}-media-img, ${componentCls}-media-video`]: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
    },
    [`${componentCls}-media-video`]: {
      background: colorBgLayout,
    },
    [`${componentCls}-media-audio`]: {
      width: '100%',
      maxWidth: '36rem',
    },
    [`${componentCls}-editor`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
  }
}

/**
 * ⚠️ 本文件留下的三处 `!important` **必要**：`-tab-item` 的 padding / marginInlineStart 要压的
 * `.ant-tabs-tab`(0,2,0) / `.ant-tabs-tab + .ant-tabs-tab`(0,3,0) **特异性比本选择器更高**，
 * `-tab-header` 的 marginBottom 同理 —— 特异性与 `order`（本仓 layer 模式下 order 不参与排序，
 * 见 `basic-crud-query/style/index.ts` 的说明）都救不了 ⇒ 只能 `!important`。
 */
export default genStyleHooks('FileEditor', genFileEditorStyle, {order: 1})

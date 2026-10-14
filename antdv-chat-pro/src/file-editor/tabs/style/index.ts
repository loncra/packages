import {unit} from '@antdv-next/cssinjs'
import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'

export default function genFileTabsStyle(token: LoncraStyleToken): CSSObject {
  const {
    componentCls,
    antCls,
    colorBgContainer,
    colorTextSecondary,
    paddingXS,
    paddingSM,
    motionDurationMid,
    calc,
  } = token

  /**
   * ⚠️ 本文件留下的三处 `!important` **必要**：`-tab-item` 的 padding / marginInlineStart 要压的
   * `.ant-tabs-tab`(0,2,0) / `.ant-tabs-tab + .ant-tabs-tab`(0,3,0) **特异性比本选择器更高**，
   * `-tab-header` 的 marginBottom 同理 —— 特异性与 `order`（本仓 layer 模式下 order 不参与排序，
   * 见 `basic-crud-query/style/index.ts` 的说明）都救不了 ⇒ 只能 `!important`。
   */
  return {
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
    [`${componentCls}-grow`]: {
      flex: 1,
      minWidth: 0,
    },
    [`${componentCls}-pane`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
    },
  }
}

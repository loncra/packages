import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genSystemUserPanelStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, paddingXS, colorTextQuaternary, lineWidth, lineType, colorBorderSecondary} = token
  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      height: '100%',
    },
    // 左侧列表：撑满父级高度，滚动交给内部 Conversations
    [`${componentCls}-list`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 320,
      overflow: 'hidden',
    },
    [`${componentCls}-list-full`]: {
      width: '100%',
    },
    [`${componentCls}-list-split`]: {
      width: '30%',
    },
    [`${componentCls}-search`]: {
      flexShrink: 0,
      padding: paddingSM,
      borderBottom: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-search-icon`]: {
      color: colorTextQuaternary,
    },
    /**
     * ⚠️ 下面这几处 **必须 `!important`**（2026-09-30 恢复）：那些类挂在 **antd 自己的元素**上
     * （`<Conversations>` 的 `class` / `classes.item` / `<Divider>` 的 `class`），与 antd 的样式
     * **同特异性打平**；而本仓样式整体住在 `@layer antd` ⇒ cssinjs 把 `prepend` 从 'queue' 关成
     * `false` ⇒ **`order` 不参与插入排序**，打平一律"后注册的赢" ⇒ antd 永远压过我们 ⇒
     * `!important` 是唯一稳定手段（依据详见 `basic-crud-query/style/index.ts` 的说明）。
     */
    [`${componentCls}-conversations`]: {
      minHeight: 0,
      width: '100%',
      flex: '1 1 0',
      padding: '0 !important',
      gap: '0 !important',
    },
    // 覆盖 Conversations 行默认的高度 / 圆角 / 内边距
    [`${componentCls}-item`]: {
      height: 'auto !important',
      minHeight: 'auto !important',
      borderRadius: '0 !important',
      padding: `${unit(paddingXS)} !important`,
    },
    [`${componentCls}-label`]: {
      flex: 1,
    },
    [`${componentCls}-selected-panel`]: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 320,
      padding: paddingSM,
      width: '70%',
    },
    [`${componentCls}-selected-divider`]: {
      marginTop: '0 !important',
    },
    [`${componentCls}-selected-item`]: {
      width: 50,
    },
    [`${componentCls}-empty`]: {
      display: 'flex',
      width: '100%',
      height: '100%',
    },
  }
}

/**
 * ⚠️ `order: 1` 在本仓**不是样式覆盖的保障**：本仓样式整体住在 `@layer antd` ⇒ cssinjs 的
 * `prepend` 被关成 `false` ⇒ `order` 不参与插入排序（见 `basic-crud-query/style/index.ts` 的说明）。
 * 留着无害；与 antd 同特异性竞争时用 `!important` 并写明依据。
 */
export default genStyleHooks('SystemUserPanel', genSystemUserPanelStyle, {order: 1})

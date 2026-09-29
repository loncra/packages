import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {unit} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genSystemUserPanelStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, paddingSM, paddingXS, colorTextQuaternary} = token
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
    },
    [`${componentCls}-search-icon`]: {
      color: colorTextQuaternary,
    },
    /**
     * 下面这几处原来是靠 `!important` 压 `Conversations` / `Divider` 自己的默认样式 —— 那几个类是挂在
     * **antd 自己的元素**上的（`class` / `classes.item`），与 antd 的规则**同特异性打平** ⇒ 谁后注入谁赢
     * （来龙去脉见 `@loncra/antdv` 的 `icon-select/style/index.ts` 那段说明）。顺序已改成 `{order: 1}`
     * （排在 antd 之后注入）⇒ **同特异性的冲突自然赢，`!important` 全撤**。
     */
    [`${componentCls}-conversations`]: {
      minHeight: 0,
      width: '100%',
      flex: '1 1 0',
      padding: '0',
      gap: '0',
    },
    // 覆盖 Conversations 行默认的高度 / 圆角 / 内边距
    [`${componentCls}-item`]: {
      height: 'auto',
      minHeight: 'auto',
      borderRadius: '0',
      padding: unit(paddingXS),
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
      marginTop: '0',
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

/** `order` 传正数：本组件的规则排在 antd 之后注入 ⇒ 同特异性的冲突自然赢（理由同 `icon-select`） */
export default genStyleHooks('SystemUserPanel', genSystemUserPanelStyle, {order: 1})

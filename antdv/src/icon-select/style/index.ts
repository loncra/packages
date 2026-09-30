import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

function genIconSelectStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, controlHeightLG, fontSizeXL, marginXS, paddingMD, calc} = token

  return {
    [componentCls]: {
      [`&-preview`]: {
        position: 'relative',
        display: 'inline-block',
      },
      // ⚠️ 自己这几个类一律写成 `&-x`（= 单个类名）—— 别在 `[componentCls]` 里再写完整类名
      // `${componentCls}-x`：那会生成 `.loncra-icon-select .loncra-icon-select-x`（两级），
      // 与同文件 `&-x` 的单级规则**特异性不齐**，以后覆盖时就得靠加 `!important` 或堆选择器
      [`&-compact`]: {
        flex: 1,
      },
      [`&-select`]: {
        // 与 antd `.ant-space-compact-item` 抢宽度：特异性打平 ⇒ **必须 `!important`** ——
        // `order` 在本仓救不了（本仓样式住在 `@layer antd` ⇒ cssinjs 的 `prepend` 被关成 `false`
        // ⇒ `order` 不参与插入排序，打平一律"后注册的赢"，见文件末的说明）
        width: 'auto !important',
      },
      [`&-payload`]: {
        width: '100%',
      },
      /**
       * 弹层标题行里的搜索框：占满整行。`100%` 与 antd `.ant-input-group-wrapper`（`Input.Search` 的根）
       * 自身的宽度一致 ⇒ 不存在"抢属性"，单级类就够，不用抬 `order` 也不用 `!important`。
       * 标题行里**没有**左侧标签了（2026-09-28 用户定：去掉「图标」标签，改在输入框里用占位文案提示）
       * ⇒ 之前为防挤压加的 `flex: none` / `white-space: nowrap` 一并撤掉。
       */
      [`&-search`]: {
        width: '100%',
      },
      [`${antCls}-tabs-nav`]: {
        margin: 0
      },
      [`${antCls}-tabs-body`]: {
        margin: 0,
        paddingTop: paddingMD
      }
    },
    [`${componentCls}-avatar`]: {
      width: '100%',
      gap: marginXS,
    },
    [`${componentCls}-tabs-body`]: {
      overflow: 'auto',
      maxHeight: calc(controlHeightLG).mul(8).equal(),
    },
    [`${componentCls}-popover-body`]: {
      overflow: 'auto',
      /*maxHeight: `${calc(controlHeightLG).mul(4).equal()} !important`,
      maxWidth: `${calc(controlHeightLG).mul(10).equal()} !important`,*/
      maxHeight: calc(controlHeightLG).mul(4).equal(),
      maxWidth: calc(controlHeightLG).mul(10).equal(),
    },
    [`${componentCls}-glyph`]: {
      fontSize: fontSizeXL,
    },
  }
}

/**
 * ⚠️ `order` 是**样式注入顺序**，不是"优先级开关的档位"：cssinjs 内部是
 * `order: options.order || -999`（`@antdv-next/cssinjs` 的 `genStyleUtils.js`）——
 * **`0` 是 falsy** ⇒ 传 `{order: 0}` 与不传完全一样。
 *
 * ⚠️⚠️ **但 2026-09-30 实测：`order` 在本仓救不了与 antd 的同特异性打平** ——
 * 本仓样式整体住在 `@layer antd`（`genStyleUtils.js` 的 `layer` 配置）⇒ cssinjs 把
 * `prepend` 从 'queue' 关成 `false`（`useStyleRegister.js`）⇒ `dynamicCSS.js` 的 priority
 * **只在 queue 模式下参与插入排序** ⇒ 打平一律"后注册的赢"，而 antd 组件是**我们的子组件、
 * 后注册** ⇒ **永远压过我们**。⇒ 与 antd 同特异性竞争时，**唯一稳定手段是 `!important`**
 * （如上面 `&-select` 的 width）；`order: 1` 留着无害，但**别把它当保障**。
 */
export default genStyleHooks('IconSelect', genIconSelectStyle, {order: 1})

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
        // 与 antd `.ant-space-compact-item` 抢宽度：靠 `order`（见文件末）先占住注入顺序，
        // 这里的 `!important` 是先前的权宜之计，试过能撤再撤
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
 * `order: options.order || -999`（`@antdv-next/cssinjs` 的 `genStyleUtils.js:105`）——
 * **`0` 是 falsy** ⇒ 传 `{order: 0}` 与不传完全一样，都落进 `-999` 那个"前置队列"，
 * 而 antd 自己的组件样式（Button / Select / Tabs / Space…）默认也是 `-999` ⇒ **打平**，
 * 打平就看**谁先注册**：我们是在自己的 setup 里注册、比子组件（antd 那些）早 ⇒ 同特异性时
 * **antd 后写的赢** ⇒ 只能靠 `!important` 硬顶（本文件那两处、以及 `instruction-sender` 那四处的由来）。
 *
 * 传一个**正数**（> -999 即可）⇒ 本组件的规则排在 antd 之后注入 ⇒ 同特异性的冲突自然赢，
 * 不需要 `!important`。以后本仓组件要覆盖 antd 内部类时，都该走这条路。
 */
export default genStyleHooks('IconSelect', genIconSelectStyle, {order: 1})

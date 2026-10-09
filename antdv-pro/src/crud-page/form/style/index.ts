import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

/**
 * 表单页（`CrudFormPage`）的样式。
 *
 * ⚠️ pro **不带 Tailwind、也不写内联 `style`**（规矩见 `config-provider-setting/style/index.ts` 的注释）
 * ⇒ 样式一律走 CSS-in-JS：值用 token，换主题 / 紧凑模式会跟着变。
 *
 * 用法同其它 pro 组件：`const [hashId, cssVarCls] = useStyle(prefixCls)`，再把
 * `hashId` / `cssVarCls` 和 `${prefixCls}-xxx` 一起 `classNames(...)` 挂到元素上
 * —— 规则只有带了 hash 类才会被生成并命中（`data-loading-card-plan/style/index.ts:120` 那段注释记过这个坑）。
 */
function genCrudFormPageStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, marginMD} = token

  return [
    {
      // 操作记录那一块（分隔线 + 轨迹表）：它不在 `FormItem` 里、没有现成的行距 ⇒ 自己给一段，
      // 免得轨迹表与下面的按钮贴在一起。
      [`${componentCls}-operation-trace`]: {
        marginBottom: marginMD,
      },
    },
  ]
}

export default genStyleHooks('CrudFormPage', genCrudFormPageStyle)

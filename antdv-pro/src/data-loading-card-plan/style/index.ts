import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'

function genDataLoadingCardPlanStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls} = token

  return [
    {
      // 内容区的转圈包裹层（`Spin` 有 children 时它就是 `-nested-loading` 那层）：
      // 撑满 + block，免得住 `flex` / 全高布局（如聊天页 `body:'flex flex-1 overflow-hidden'`）
      // 的页面因为多出这层而塌掉。卡 body 高度是 auto 时，`height:100%` 会按 auto 解析，等于没加。
      [`${componentCls}-spin`]: {
        display: 'block',
        width: '100%',
        height: '100%',
        [`${antCls}-spin-container`]: {height: '100%'},
      },
    },
  ]
}

export default genStyleHooks('DataLoadingCardPlan', genDataLoadingCardPlanStyle)

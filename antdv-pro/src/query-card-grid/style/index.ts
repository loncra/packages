import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'
import {genDragGhostStyle, genDragStyle} from '../../_util/crud/genDragStyle'

function genQueryCardGridStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorInfoBg} = token

  return [
    {
      [componentCls]: {
        '.icon': {verticalAlign: 'middle'},
        '.icon.align': {marginBottom: '3px'},
        // 壳是 `DataLoadingCardPlan` 的 Card，网格要贴边：等价于 antd 的 `contain-grid`
        // （那边靠 `<Card>` 的直接子节点判定，中间隔着 plan 的 `<Spin>` 判不出来）
        [`${antCls}-card-body`]: {
          padding: 0,
          marginBlockStart: -1,
          marginInlineStart: -1,
        },
        // 网格容器：自备 flex 换行（同上，不再依赖 antd 的 `contain-grid`）
        [`${componentCls}-grid`]: {
          display: 'flex',
          flexWrap: 'wrap',
        },
        // 内容区的转圈包裹层：基类不再出 `Spin`（`plain` 用不上、表格自带 `loading`），
        // 卡片网格自己出 ⇒ 撑满 + block，免得住 flex / 全高布局的页面因多出这层而塌掉。
        [`${componentCls}-spin`]: {
          display: 'block',
          width: '100%',
          height: '100%',
          [`${antCls}-spin-container`]: {height: '100%'},
        },
        [`${antCls}-card-grid${componentCls}-item`]: {
          width: 'calc(100% / var(--loncra-card-grid-columns, 5))',
        },
        [`${antCls}-card-grid${componentCls}-item-selected`]: {
          backgroundColor: colorInfoBg,
        },
        ...genDragStyle(token, componentCls),
      },
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryCardGrid', genQueryCardGridStyle)

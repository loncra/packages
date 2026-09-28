import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'
import {genDragGhostStyle, genDragStyle} from '../../_util/crud/genDragStyle'

function genQueryTableStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls, colorPrimary, padding, paddingXS} = token

  return [
    {
      [componentCls]: {
        '.icon': {verticalAlign: 'middle'},
        '.icon.align': {marginBottom: '3px'},
        [`${antCls}-table-content`]: {borderRadius: 0},
        /**
         * `plain` 时表格自带标题里那一行（左标题、右工具栏）：`.ant-table-title` 自己已有内边距，
         * 这里只负责把它排成一行 —— 标题与表格**同进同退**，不再出现"标题在原地、表格被 antd
         * 的嵌套表规则拉走 32px"的错位。
         */
        [`${componentCls}-table-title`]: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: paddingXS,
          [`${antCls}-typography`]: {marginBottom: 0},
        },
        [`${componentCls}-filter-icon-active`]: {color: colorPrimary},
        ...genDragStyle(token, componentCls),
      },
    },
    {
      [`${componentCls}-filter-dropdown`]: {padding},
    },
    genDragGhostStyle(token, componentCls),
  ]
}

export default genStyleHooks('QueryTable', genQueryTableStyle)

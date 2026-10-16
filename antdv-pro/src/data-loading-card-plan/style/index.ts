import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genDataLoadingCardPlanStyle(token: LoncraStyleToken): CSSInterpolation {
  const {antCls, componentCls} = token

  return [
    {
      [`${componentCls}-spin`]: {
        display: 'block',
        width: '100%',
        height: '100%',
        [`${antCls}-spin-container`]: {height: '100%'},
      },
    },
  ]
}

export default genStyleHooks('DataLoadingCardPlan', genDataLoadingCardPlanStyle, {order: 2})

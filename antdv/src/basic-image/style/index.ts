import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'
import {genStyleHooks} from '../../_util/genStyleLayer'
import {genCoverImageStyle} from '../../_util/style/fragments'

function genBasicImageStyle(token: LoncraStyleToken): CSSInterpolation {
  const { componentCls, antCls } = token
  return {
    [componentCls]: {
      display: 'block',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      [`${antCls}-image`]: {
        display: 'block',
      },
      ...genCoverImageStyle(token, {objectPosition: 'center'}),
    },
  } as CSSInterpolation
}

export default genStyleHooks('BasicImage', genBasicImageStyle, {order: 1})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '../../_util/genStyleLayer'

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
      [`${antCls}-image, ${antCls}-image-img`]: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('BasicImage', genBasicImageStyle, {order: 1})

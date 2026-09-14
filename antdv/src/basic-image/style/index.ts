import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyle'
import {genStyleHooks} from '../../_util/genStyle'

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
        width: '100%',
        height: '100%',
      },
      [`${antCls}-image-img`]: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      },
    },
  } as CSSInterpolation
}

export default genStyleHooks('BasicImage', genBasicImageStyle)

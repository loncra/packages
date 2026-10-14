import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'

export default function genFileTextPaneStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls} = token
  return {
    [`${componentCls}-editor`]: {
      width: '100%',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    },
  }
}

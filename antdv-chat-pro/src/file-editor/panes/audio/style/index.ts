import type {CSSObject} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '@loncra/antdv'

export default function genFileAudioPaneStyle(token: LoncraStyleToken): CSSObject {
  const {componentCls} = token
  return {
    [`${componentCls}-media-audio`]: {
      width: '100%',
      maxWidth: '36rem',
    },
  }
}

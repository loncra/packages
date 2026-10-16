import type {CSSInterpolation} from '@antdv-next/cssinjs'
import type {LoncraStyleToken} from '../../_util/genStyleLayer'
import {genStyleHooks} from '../../_util/genStyleLayer'

function genFileEditorStyle(token: LoncraStyleToken): CSSInterpolation {
  const {componentCls, antCls, borderRadiusLG, colorBorderSecondary, lineWidth, lineType} = token
  return {
    [componentCls]: {
      display: 'flex',
      width: '100%',
      minHeight: '30rem',
      height: '30rem',
      maxHeight: '45rem',
      overflow: 'hidden',
      flexDirection: 'column',
      [`${antCls}-splitter`]: {
        flex: 1,
        minHeight: 0,
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
      },
      [`${antCls}-splitter ${antCls}-splitter-panel`]: {
        minHeight: 0,
        overflow: 'hidden',
        padding: 0,
      },
    },
    [`${componentCls}-hidden-upload`]: {
      display: 'none',
    },
    [`${componentCls}-splitter`]: {
      borderRadius: borderRadiusLG,
      border: `${lineWidth} ${lineType} ${colorBorderSecondary}`,
    },
    [`${componentCls}-panel`]: {
      minHeight: 0,
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
    [`${componentCls}-panel-main`]: {
      minHeight: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      padding: 0,
    },
  }
}

export default genStyleHooks('FileEditor', genFileEditorStyle, {order: 4})

import type {CSSInterpolation} from '@antdv-next/cssinjs'
import {genStyleHooks, type LoncraStyleToken} from '@loncra/antdv'
import genFileConversationStyle from '../conversation/style'
import genFileTabsStyle from '../tabs/style'
import genFileAudioPaneStyle from '../panes/audio/style'
import genFilePanesStyle from '../panes/style'
import genFileTextPaneStyle from '../panes/text/style'

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
    ...genFileConversationStyle(token),
    ...genFileTabsStyle(token),
    ...genFilePanesStyle(token),
    ...genFileAudioPaneStyle(token),
    ...genFileTextPaneStyle(token),
  }
}

export default genStyleHooks('FileEditor', genFileEditorStyle, {order: 1})

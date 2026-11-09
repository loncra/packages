import FileView from './FileView'

export default FileView
export type {
  FilePaneContext,
  FilePaneKindId,
  FilePaneMode,
  FileViewClasses,
  FileViewExpose,
  FileViewNode,
  FileViewOpenResult,
  FileViewProps,
  FileViewSlots,
  FileViewSource,
  FileViewStyles,
  ResolvedFilePaneKind,
} from './types'
export {buildFilePaneContext, isTextTooLarge, resolveFilePaneKind} from './filePaneKinds'
export {default as FileTextCodeEditor} from './panes/text/TextCodeEditor'

import type {FileViewNode, FileViewProps} from '../file-view'

export interface AttachmentExtra {
  objectName: string
  etag?: string
  userMetadata?: Record<string, string>
}

export interface FileEditorNode extends FileViewNode {
  editing?: boolean
  editName?: string
  children?: FileEditorNode[]
  extra?: AttachmentExtra
}

export interface AttachmentFileEditorProps {
  bucket: string
  path: string
  readonly?: boolean
  name?: string
  height?: string | number
  maxHeight?: string | number
  getIcon?: FileViewProps['getIcon']
  prefixCls?: string
  rootClass?: string
  classes?: FileViewProps['classes']
  styles?: FileViewProps['styles']
}

export interface TextEditorEntry {
  dirty: boolean
  save: () => Promise<void>
}

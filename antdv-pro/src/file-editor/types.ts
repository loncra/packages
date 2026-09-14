import type {ObjectItemInfo} from '@loncra/client/resource'

export type FilePaneKindId = 'image' | 'video' | 'audio' | 'text' | 'fallback'
export type FilePaneMode = 'view' | 'edit'

export interface FilePaneContext {
  name: string
  mime: string
  ext: string
  size: number
}

export interface ResolvedFilePaneKind {
  id: FilePaneKindId
  mode: FilePaneMode
}

export interface FileEditorProps {
  readonly?: boolean
  name?: string
  path: string
  bucket: string
  height?: string | number
  maxHeight?: string | number
  getIcon?: (item: ObjectItemInfo) => string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface FileEditorSlots {}

export interface FilePaneProps {
  item: ObjectItemInfo
  bucket: string
  readonly: boolean
  rootPath: string
}

export interface EditObjectItemInfo extends ObjectItemInfo {
  editing?: boolean
  content?: string
  key: string
  editName: string
  readonly?: boolean
  name?: string
}

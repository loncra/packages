import type {VNodeChild} from 'vue'
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
  /**
   * 文件图标：宿主按**文件后缀**（`item.objectName`）自定义，直接给渲染结果（VNode）。
   * 不给就用组件内置的 antd 图标（文件 `FileOutlined`、目录 `FolderOutlined` / `FolderOpenOutlined`）。
   */
  getIcon?: (item: ObjectItemInfo) => VNodeChild
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

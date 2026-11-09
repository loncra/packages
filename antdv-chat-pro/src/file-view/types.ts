import type {CSSProperties, VNodeChild} from 'vue'
import type {MenuItemType} from 'antdv-next'
import type {ResolvedAction} from '@loncra/antdv-pro'

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

export interface FileViewNode {
  id: string
  name: string
  dir: boolean
  size?: number
  mime?: string
  children?: FileViewNode[]
  loading?: boolean
  extra?: unknown
}

export type FileViewOpenResult =
  | {type: 'url'; url: string}
  | {type: 'blob'; blob: Blob}

export interface FileViewSource {
  list(parent: FileViewNode | null): Promise<FileViewNode[]>
  open(node: FileViewNode): Promise<FileViewOpenResult>
}

export interface FileViewClasses {
  root?: string
  splitter?: string
  panel?: string
  panelMain?: string
}

export interface FileViewStyles {
  root?: CSSProperties
  splitter?: CSSProperties
  panel?: CSSProperties
  panelMain?: CSSProperties
}

export interface FileViewProps {
  source: FileViewSource
  name?: string
  height?: string | number
  maxHeight?: string | number
  getIcon?: (node: FileViewNode) => VNodeChild
  confirmClose?: (node: FileViewNode) => Promise<boolean>
  dirty?: (node: FileViewNode) => boolean
  onDownload?: (node: FileViewNode) => void
  toolbarActions?: ResolvedAction[]
  menuItems?: (node: FileViewNode) => MenuItemType[]
  prefixCls?: string
  rootClass?: string
  classes?: FileViewClasses
  styles?: FileViewStyles
}

export interface FileViewSlots {
  title?: (props: {node: FileViewNode}) => VNodeChild
  tabExtra?: (props: {node: FileViewNode}) => VNodeChild
  pane?: (props: {node: FileViewNode}) => VNodeChild
}

export interface FileViewExpose {
  reveal(id: string): void
  reload(node: FileViewNode | null): Promise<void>
  closeTabs(match: (node: FileViewNode) => boolean): void
}

export interface FileViewState {
  loading: boolean
  openKeys: string[]
  selected?: FileViewNode
  tabs: FileViewNode[]
  dataSource: FileViewNode[]
}

import type {CSSProperties} from 'vue'
import type {ObjectItemInfo, ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {SemanticClassNamesType, SemanticStylesType,} from 'antdv-next/dist/_util/hooks/useMergeSemantic'
import type {ATTACHMENT_PREVIEW_MODE, ATTACHMENT_UPLOAD_MODE} from './constants'

export type AttachmentUploadMode =
  (typeof ATTACHMENT_UPLOAD_MODE)[keyof typeof ATTACHMENT_UPLOAD_MODE]
export type AttachmentPreviewMode =
  (typeof ATTACHMENT_PREVIEW_MODE)[keyof typeof ATTACHMENT_PREVIEW_MODE]

export type AttachmentFileItem = UploadFile<ObjectWriteResult> | ObjectWriteResult | ObjectItemInfo

export interface AttachmentPathItem extends UploadFile<ObjectWriteResult> {
  children?: AttachmentPathItem[]
}

export type AttachmentValue = AttachmentFileItem | AttachmentFileItem[] | undefined

export type AttachmentUploadExpose = {
  upload: () => Promise<ObjectWriteResult | ObjectWriteResult[] | undefined>
  getFiles: () => AttachmentFileItem[]
  uploadFile: (file: UploadFile) => Promise<ObjectWriteResult>
}

export interface AttachmentUploadExecutorOptions {
  postFilename: string
  promiseLimit: number
  param?: Record<string, unknown>
  headers?: Record<string, string>
}

export interface BasicAttachmentProps {
  multiple?: boolean
  preview?: boolean
  accept?: string
  disabled?: boolean
  maxCount?: number
}

export interface AttachmentSemanticContextProps {
  mode?: AttachmentUploadMode | AttachmentPreviewMode
  preview?: boolean
  maxCount?: number
  multiple?: boolean
}

/**
 * 宿主可挂的语义类名（`classes`）—— **每个键落在哪个元素上写清楚，别猜**：
 *
 * - `container`：最外层容器（列表 / 卡片两种模式共用）
 * - `list`：列表容器（列表模式 = `-list`；卡片模式 = `-list-cards`）
 * - `item`：每个附件项
 * - `meta`：附件项里"名称 / 说明"那一块
 * - `trigger`：**触发上传的那块区域** —— picture-card 模式 = pro 自己那个虚线框（`-trigger`，
 *   `padding` / `1px dashed` / 圆角都在它身上）；dragger 模式 pro 没有 wrapper ⇒ 转给 antd
 *   `UploadDragger` 的 `trigger`（就是那个大拖拽区）。
 *   ⚠️ **不再透传给 antd 的 `Upload`**（2026-09-29 起）：`trigger` 的归属就是"宿主看到的那块触发区"；
 *   里面那层 `.ant-upload` 要改只能自己写全局类名。
 */
export interface AttachmentUploadSemanticClassNames {
  container?: string
  list?: string
  item?: string
  trigger?: string
  meta?: string
}

/** 与 `AttachmentUploadSemanticClassNames` **同一套落点**（`meta` 没有对应的 styles 项） */
export interface AttachmentUploadSemanticStyles {
  container?: CSSProperties
  list?: CSSProperties
  item?: CSSProperties
  trigger?: CSSProperties
}

export type AttachmentUploadClassNamesType = SemanticClassNamesType<
  AttachmentSemanticContextProps,
  AttachmentUploadSemanticClassNames
>

export type AttachmentUploadStylesType = SemanticStylesType<
  AttachmentSemanticContextProps,
  AttachmentUploadSemanticStyles
>

export type AttachmentUploadResolvedClassNames = Readonly<AttachmentUploadSemanticClassNames>
export type AttachmentUploadResolvedStyles = Readonly<AttachmentUploadSemanticStyles>

export interface AttachmentOperationProps {
  disabled?: boolean
  canPreview?: (file: UploadFile<ObjectWriteResult>) => boolean | undefined
  canDelete?: (file: UploadFile<ObjectWriteResult>) => boolean | undefined
  canDownload?: (file: UploadFile<ObjectWriteResult>) => boolean | undefined
}

export interface AttachmentUploadPublicDomProps extends AttachmentOperationProps {
  classes?: AttachmentUploadClassNamesType
  styles?: AttachmentUploadStylesType
}

export interface AttachmentUploadDomProps extends AttachmentOperationProps {
  classes?: AttachmentUploadResolvedClassNames
  styles?: AttachmentUploadResolvedStyles
}

export interface AttachmentUploadProps extends BasicAttachmentProps, AttachmentUploadPublicDomProps {
  value?: AttachmentValue
  mode?: AttachmentUploadMode
  postFilename?: string
  autoUpload?: boolean
  showFilename?: boolean
  action?: string
  promiseLimit?: number
  bucket?: string
  uploadOptions?: Record<string, unknown>
  previewMode?: AttachmentPreviewMode
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
}

export interface AttachmentUploadEmits {
  'update:value': (value: AttachmentValue) => void
  remove: (file: UploadFile<ObjectWriteResult>) => void
  change: (info: unknown) => void
}

export interface AttachmentUploadSlots {
  default?: () => unknown
  itemRender?: (ctx: {file: UploadFile<ObjectWriteResult>}) => unknown
  itemIcon?: (ctx: {file: UploadFile<ObjectWriteResult>}) => unknown
  itemTitle?: (ctx: {file: UploadFile<ObjectWriteResult>}) => unknown
  itemDescription?: (ctx: {file: UploadFile<ObjectWriteResult>}) => unknown
  uploadDescription?: () => unknown
}

export interface AttachmentPreviewProps extends AttachmentUploadDomProps, AttachmentOperationProps {
  fileList?: UploadFile<ObjectWriteResult>[]
  mode?: AttachmentPreviewMode
  changeThumbUrl?: boolean
  showFilename?: boolean
  preview?: boolean
  height?: string
  width?: string
}

export interface AttachmentPreviewFileProps extends AttachmentOperationProps {
  file: UploadFile<ObjectWriteResult>
  border?: boolean
  itemClass?: string
  itemStyle?: CSSProperties
}

export interface AttachmentDraggerUploadProps extends AttachmentPreviewProps, BasicAttachmentProps {}

export interface AttachmentPictureCardUploadProps
  extends AttachmentPreviewProps, BasicAttachmentProps {}

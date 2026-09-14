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

export interface AttachmentUploadSemanticClassNames {
  container?: string
  list?: string
  item?: string
  trigger?: string
  meta?: string
}

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

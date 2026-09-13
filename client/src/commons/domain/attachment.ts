import type {BasicIdMetadata, IdValueMetadata, NameValueEnumMetadata} from './common.ts'

export interface FileObject {
  bucketName: string
  objectName: string
  extraHeaders?: Record<string, string>
}

export interface CopyFileObject {
  source: FileObject
  target: FileObject
}

export interface MoveFileObject extends CopyFileObject {
  deleteBucketIfEmpty?: boolean
}

export interface ObjectWriteResult extends FileObject {
  etag: string
  size: number
  lastModified: number
}

export interface MultipartUploadInitData {
  uploadId: string
  chunk: number
  uploadBlockSize: number
}

export interface MultipartUploadPartData {
  etag: string
  partNumber: number
}

export interface CompleteMultipartUploadBody {
  uploadId: string
  parts: IdValueMetadata<string, number>[]
}

export interface ObjectItemInfo extends BasicIdMetadata<string> {
  id: string
  bucketName: string
  objectName: string
  etag: string
  lastModified: number
  size: number
  userMetadata: Record<string, string>
  storageClass: string
  latest: boolean
  versionId: string
  userTags: string[]
  dir: boolean
  group?: string
  children?: ObjectItemInfo[]
  loading?: boolean
}

export interface ExportDataMetadata {
  id: string
  creationTime: number
  filename: string
  executeStatus: NameValueEnumMetadata<number>
  exception: string
  successTime: number
  retryTime: number
  retryCount: number
  maxRetryCount: number
  type: NameValueEnumMetadata<number>
  size: number
  expiresTime?: number
  metadata: Record<string, unknown>
}

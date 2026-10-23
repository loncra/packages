import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  type AttachmentFileItem,
  isObjectWriteResult,
  isUploadFile,
  isVideoFile,
} from '../_util/attachmentList'
import type {AttachmentFileKind} from './types'

export {isVideoFile} from '../_util/attachmentList'

const ATTACHMENT_STATUS_META = {
  none: {suffix: 'warning', alert: 'warning'},
  uploading: {suffix: 'info', alert: 'info'},
  done: {suffix: 'success', alert: 'success'},
  error: {suffix: 'error', alert: 'error'},
} as const

export function attachmentStatusMeta(status: string | undefined) {
  return ATTACHMENT_STATUS_META[(status ?? 'none') as keyof typeof ATTACHMENT_STATUS_META]
}

export function attachmentStatusSuffix(status: string | undefined): string | undefined {
  return attachmentStatusMeta(status)?.suffix
}

export function attachmentAlertType(status: string | undefined) {
  return attachmentStatusMeta(status)?.alert ?? 'warning'
}

export function attachmentStatusClass(
  prefix: string,
  base: string,
  status: string | undefined,
): string | undefined {
  const suffix = attachmentStatusSuffix(status)
  return suffix ? `${prefix}-${base}-${suffix}` : undefined
}

export function isImageFile(file: UploadFile<ObjectWriteResult>): boolean {
  return (
    file.type !== 'directory' && !!file.type?.includes('image/') && !!(file.thumbUrl || file.url)
  )
}

export function detectAttachmentFileKind(file?: {
  type?: string
  name?: string
}): AttachmentFileKind {
  if (file?.type === 'directory') {
    return 'directory'
  }
  if (isVideoFile(file)) {
    return 'video'
  }
  return (file?.type ?? '').toLowerCase().startsWith('image/') ? 'image' : 'other'
}

export function getObjectWriteResult(item: AttachmentFileItem): ObjectWriteResult | undefined {
  if (isObjectWriteResult(item)) {
    return item
  }
  if (isUploadFile(item) && item.response && item.status === 'done') {
    return item.response
  }
}

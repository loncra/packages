import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {isObjectWriteResult, isUploadFile, type AttachmentFileItem} from '../_util/attachmentList'

/**
 * status → 语义后缀 / Alert type 的**唯一来源**：
 * 未开始（undefined）= warning、uploading = info、done = success、error = error。
 * 三处消费：卡片边框（`-card-*`）、缩略图边框（`-thumb-border-*`）、Alert 的 type。
 */
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

/** 状态 → 语义类（`${prefix}-${base}-${suffix}`）；未知状态（如 antd 的 `removed`）不出类 */
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

/** 已上传完成的叶子交回 `ObjectWriteResult`；没传完（UploadFile 外壳）返回 undefined */
export function getObjectWriteResult(item: AttachmentFileItem): ObjectWriteResult | undefined {
  if (isObjectWriteResult(item)) {
    return item
  }
  if (isUploadFile(item) && item.response && item.status === 'done') {
    return item.response
  }
}

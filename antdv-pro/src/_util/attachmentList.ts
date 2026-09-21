import type {ObjectItemInfo, ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {AttachmentFileItem, AttachmentPathItem, AttachmentValue} from '../attachment-upload/types'

export function isObjectWriteResult(item: unknown): item is ObjectWriteResult {
  return !!item && typeof item === 'object' && 'bucketName' in item && 'objectName' in item
}

export function isUploadFile(item: unknown): item is UploadFile {
  return !!item && typeof item === 'object' && 'uid' in item
}

/** 展示名：优先上传时写进元数据的原始文件名，其次取 `objectName` 最后一段 */
export function resolveDisplayName(item: ObjectItemInfo): string {
  return (
    item.userMetadata?.['X-Amz-Meta-Original-Filename'] ||
    item.objectName.replace(/\/$/, '').split('/').pop() ||
    item.objectName
  )
}

export function convertUploadFiles(
  fileList: AttachmentFileItem[],
): UploadFile<ObjectWriteResult>[] {
  const result: UploadFile<ObjectWriteResult>[] = []
  for (const file of fileList) {
    if (isObjectWriteResult(file)) {
      const contentType = file?.extraHeaders?.['Content-Type'] || ''
      const url = AttachmentService.query(file.bucketName, file.objectName)
      result.push({
        uid: file.etag,
        name: file?.extraHeaders?.['x-amz-meta-original-filename'] || file.objectName,
        url,
        thumbUrl: ['image/', 'video/'].some((v) => contentType.startsWith(v)) ? url : undefined,
        type: contentType || undefined,
        size: file.size || 0,
        percent: 100,
        status: 'done',
        response: file,
      })
    } else if (isUploadFile(file)) {
      result.push(file)
    }
    // 这里原有个 `isObjectItemInfo` 分支：守卫与 `isObjectWriteResult` 逐字相同 ⇒ 永远进不来（死代码）。
    // 要处理 `ObjectItemInfo`（`userMetadata` 那套）得先给它一个能与 `ObjectWriteResult` 区分开的判定。
  }

  return result
}

export function detectAttachmentValueMode(
  value: AttachmentValue | null,
  maxCount?: number,
): 'single' | 'multiple' {
  if (Array.isArray(value)) {
    return 'multiple'
  }
  if (isUploadFile(value) || isObjectWriteResult(value)) {
    return 'single'
  }
  return maxCount === 1 ? 'single' : 'multiple'
}

export function normalizeAttachmentToList(
  value: AttachmentValue | null,
): (UploadFile | ObjectWriteResult | ObjectItemInfo)[] {
  if (value == null) {
    return []
  }
  if (Array.isArray(value)) {
    return [...value]
  }
  if (isObjectWriteResult(value)) {
    return [...convertUploadFiles([value as ObjectWriteResult])]
  }
  return []
}

export function denormalizeAttachmentFromList(
  list: (UploadFile | ObjectWriteResult)[],
  referenceValue: AttachmentValue | null,
  maxCount?: number,
): AttachmentValue {
  const mode = detectAttachmentValueMode(referenceValue, maxCount)
  if (list.length === 0) {
    return mode === 'single' ? undefined : []
  }
  return mode === 'single' ? list[0] : [...list]
}

function relativePathOf(file: UploadFile): string | undefined {
  const raw = file.originFileObj as File | undefined
  const path = raw?.webkitRelativePath?.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '')
  return path || undefined
}

export function buildAttachmentPathTree(
  files: UploadFile<ObjectWriteResult>[],
): AttachmentPathItem[] {
  const roots: AttachmentPathItem[] = []
  const folders = new Map<string, AttachmentPathItem>()
  function folderNode(absPath: string, name: string): AttachmentPathItem {
    let node = folders.get(absPath)
    if (node) {
      return node
    }
    node = {
      uid: `dir:${absPath}`,
      name,
      type: 'directory',
      children: [],
    }
    folders.set(absPath, node)
    return node
  }
  function parentList(dirAbsPath: string): AttachmentPathItem[] {
    if (!dirAbsPath) {
      return roots
    }
    let siblings = roots
    let acc = ''
    for (const seg of dirAbsPath.split('/')) {
      acc = acc ? `${acc}/${seg}` : seg
      const node = folderNode(acc, seg)
      if (!siblings.includes(node)) {
        siblings.push(node)
      }
      siblings = node.children!
    }
    return siblings
  }
  for (const file of files) {
    const path = relativePathOf(file)
    if (!path) {
      roots.push({...file})
      continue
    }
    const parts = path.split('/').filter(Boolean)
    const fileName = parts.pop()!
    const dirAbs = parts.join('/')
    parentList(dirAbs).push({
      ...file,
      name: fileName,
    })
  }
  applyAttachmentDirectoryProgress(roots)
  return roots
}

export function collectAttachmentFileLeaves(
  nodes: AttachmentPathItem[] = [],
): AttachmentPathItem[] {
  const result: AttachmentPathItem[] = []
  for (const node of nodes) {
    if (node.type === 'directory') {
      result.push(...collectAttachmentFileLeaves(node.children ?? []))
    } else {
      result.push(node)
    }
  }
  return result
}

export function applyAttachmentDirectoryProgress(nodes: AttachmentPathItem[] = []): void {
  for (const node of nodes) {
    if (node.type !== 'directory') {
      continue
    }
    applyAttachmentDirectoryProgress(node.children ?? [])
    const leaves = collectAttachmentFileLeaves([node])
    const total = leaves.reduce((sum, file) => sum + (file.size || 0), 0)
    const loaded = leaves.reduce(
      (sum, file) => sum + ((file.size || 0) * (file.percent || 0)) / 100,
      0,
    )
    const percent = total > 0 ? Math.floor((loaded * 100) / total) : 0
    if (node.size !== total) {
      node.size = total
    }
    if (node.percent !== percent) {
      node.percent = percent
    }
    let status: AttachmentPathItem['status']
    if (leaves.some((file) => file.status === 'error')) {
      status = 'error'
    } else if (leaves.length > 0 && leaves.every((file) => file.status === 'done')) {
      status = 'done'
    } else if (leaves.some((file) => file.status === 'uploading')) {
      status = 'uploading'
    } else {
      status = undefined
    }
    if (node.status !== status) {
      node.status = status
    }
  }
}

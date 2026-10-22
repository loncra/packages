import type {ObjectItemInfo, ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'

export type AttachmentFileItem = UploadFile<ObjectWriteResult> | ObjectWriteResult | ObjectItemInfo

export interface AttachmentPathItem extends UploadFile<ObjectWriteResult> {
  children?: AttachmentPathItem[]
}

export type AttachmentValue = AttachmentFileItem | AttachmentFileItem[] | undefined

export function isObjectWriteResult(item: unknown): item is ObjectWriteResult {
  return !!item && typeof item === 'object' && 'bucketName' in item && 'objectName' in item
}

export function isUploadFile(item: unknown): item is UploadFile {
  return !!item && typeof item === 'object' && 'uid' in item
}

const TS_CODE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']

export function isVideoFile(file?: {type?: string; name?: string}): boolean {
  const type = (file?.type ?? '').toLowerCase()
  if (!type.startsWith('video/')) {
    return false
  }
  const name = (file?.name ?? '').toLowerCase()
  return !TS_CODE_EXTENSIONS.some((ext) => name.endsWith(ext))
}

export function attachmentUidOf(item: AttachmentFileItem): string {
  if (isUploadFile(item)) {
    return item.uid
  }
  if (isObjectWriteResult(item)) {
    return item.etag
  }
  return String((item as ObjectItemInfo).id ?? '')
}

export function dedupeAttachmentList<T extends AttachmentFileItem>(list: T[]): T[] {
  const seen = new Set<string>()
  return list.filter((item) => {
    const uid = attachmentUidOf(item)
    if (seen.has(uid)) {
      return false
    }
    seen.add(uid)
    return true
  })
}

export function resolveDisplayName(item: ObjectItemInfo): string {
  return (
    item.userMetadata?.['X-Amz-Meta-Original-Filename'] ||
    item.objectName.replace(/\/$/, '').split('/').pop() ||
    item.objectName
  )
}

function convertObjectWriteResult(file: ObjectWriteResult): UploadFile<ObjectWriteResult> {
  const contentType = file.extraHeaders?.['Content-Type'] || ''
  const name = file.extraHeaders?.['x-amz-meta-original-filename'] || file.objectName
  const url = AttachmentService.query(file.bucketName, file.objectName)
  return {
    uid: file.etag,
    name,
    url,
    thumbUrl: contentType.startsWith('image/') ? url : undefined,
    type: contentType || undefined,
    size: file.size || 0,
    percent: 100,
    status: 'done',
    response: file,
  }
}

export function convertUploadFiles(
  fileList: AttachmentFileItem[],
): UploadFile<ObjectWriteResult>[] {
  const result: UploadFile<ObjectWriteResult>[] = []
  for (const file of fileList) {
    if (isObjectWriteResult(file)) {
      result.push(convertObjectWriteResult(file))
    } else if (isUploadFile(file)) {
      result.push(file)
    }
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
  if (isUploadFile(value)) {
    return [value]
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

function aggregateDirectoryStatus(
  leaves: AttachmentPathItem[],
): AttachmentPathItem['status'] {
  if (leaves.some((file) => file.status === 'error')) {
    return 'error'
  }
  if (leaves.length > 0 && leaves.every((file) => file.status === 'done')) {
    return 'done'
  }
  if (leaves.some((file) => file.status === 'uploading')) {
    return 'uploading'
  }
  return undefined
}

function applyDirectoryNodeProgress(node: AttachmentPathItem): void {
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
  const status = aggregateDirectoryStatus(leaves)
  if (node.status !== status) {
    node.status = status
  }
}

export function applyAttachmentDirectoryProgress(nodes: AttachmentPathItem[] = []): void {
  for (const node of nodes) {
    if (node.type === 'directory') {
      applyDirectoryNodeProgress(node)
    }
  }
}

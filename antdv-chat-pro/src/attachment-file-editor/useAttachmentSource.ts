import type {ObjectItemInfo} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import {resolveDisplayName} from '@loncra/antdv-pro'
import type {FileViewNode, FileViewSource} from '../file-view'
import type {AttachmentExtra, FileEditorNode} from './types'

export function readExtra(node: FileViewNode): AttachmentExtra {
  const extra = node.extra as AttachmentExtra | undefined
  if (!extra?.objectName) {
    throw new Error('缺少对象名')
  }
  return extra
}

function lastSegment(value: string): string {
  const trimmed = value.replace(/\/+$/, '')
  const slash = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return (slash >= 0 ? trimmed.slice(slash + 1) : trimmed).trim()
}

function toNode(item: ObjectItemInfo, replacePath: string): FileEditorNode {
  const userMetadata = {...(item.userMetadata || {})}
  if (item.dir) {
    const relative = item.objectName.replaceAll(replacePath, '').replaceAll('/', '').trim()
    if (relative) {
      userMetadata['X-Amz-Meta-Original-Filename'] = relative
    } else {
      delete userMetadata['X-Amz-Meta-Original-Filename']
    }
  }
  const name = resolveDisplayName({...item, userMetadata}).trim()
    || lastSegment(item.objectName)
    || lastSegment(item.id)
  return {
    id: item.id || item.objectName,
    name,
    dir: item.dir,
    size: item.size,
    mime: (item.userMetadata?.['Content-Type'] || '').toLowerCase(),
    extra: {
      objectName: item.objectName,
      etag: item.etag,
      userMetadata,
    },
  }
}

export function createAttachmentSource(
  bucket: () => string,
  path: () => string,
): FileViewSource {
  return {
    async list(parent) {
      const prefix = parent ? readExtra(parent).objectName : path()
      const result = await AttachmentService.findAttachment(bucket(), prefix)
      return (result.data || []).map((item) => toNode(item, prefix))
    },
    async open(node) {
      return {type: 'url', url: AttachmentService.query(bucket(), readExtra(node).objectName)}
    },
  }
}

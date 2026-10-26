import type {OutputFormat} from 'antdv-next-tiptap'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {uploadFile as executeUpload} from '../_util/uploadFile'
import type {AttachmentUploadExecutorOptions} from '../attachment-upload'
import type {UploadFn} from './types'

export interface EditorUploadOptions {
  bucket: () => string
  param: () => Record<string, unknown> | undefined
}

const POST_FILENAME = 'file'
const PROMISE_LIMIT = 3

let uploadSeq = 0

function dedupeKeyOf(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function toUploadFile(file: File): UploadFile {
  uploadSeq += 1
  return {
    uid: `editor-${uploadSeq}`,
    name: file.name,
    type: file.type,
    size: file.size,
    percent: 0,
    status: 'uploading',
    originFileObj: file as UploadFile['originFileObj'],
  }
}

function walkJsonAttrs(
  node: unknown,
  visit: (src: string, replace: (next: string) => void) => void,
): void {
  if (Array.isArray(node)) {
    node.forEach((item) => walkJsonAttrs(item, visit))
    return
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    const attrs = record.attrs
    if (attrs && typeof attrs === 'object' && typeof (attrs as Record<string, unknown>).src === 'string') {
      const src = (attrs as Record<string, unknown>).src as string
      visit(src, (next) => {
        ;(attrs as Record<string, unknown>).src = next
      })
    }
    Object.values(record).forEach((item) => walkJsonAttrs(item, visit))
  }
}

export function useEditorUpload(options: EditorUploadOptions) {
  const pending = new Map<string, File>()

  const builtinUploadFn: UploadFn = (file) => {
    const key = dedupeKeyOf(file)
    for (const [url, registered] of pending) {
      if (dedupeKeyOf(registered) === key) {
        return Promise.resolve(url)
      }
    }
    const url = URL.createObjectURL(file)
    pending.set(url, file)
    return Promise.resolve(url)
  }

  function executorOptions(): AttachmentUploadExecutorOptions {
    return {
      postFilename: POST_FILENAME,
      promiseLimit: PROMISE_LIMIT,
      param: options.param() ?? {},
    }
  }

  function resolveRemoteUrl(owr: ObjectWriteResult): string {
    return AttachmentService.query(owr.bucketName, owr.objectName)
  }

  function collectBlobUrls(value: string, outputFormat?: OutputFormat): string[] {
    if (outputFormat === 'json') {
      if (!value.trim()) {
        return []
      }
      try {
        const urls: string[] = []
        walkJsonAttrs(JSON.parse(value), (src) => {
          if (src.startsWith('blob:')) {
            urls.push(src)
          }
        })
        return [...new Set(urls)]
      } catch {
        return []
      }
    }
    const doc = new DOMParser().parseFromString(value, 'text/html')
    const urls = [...doc.querySelectorAll('[src^="blob:"]')].map((el) =>
      el.getAttribute('src') ?? '',
    )
    return [...new Set(urls.filter(Boolean))]
  }

  function replaceBlobUrls(
    value: string,
    outputFormat: OutputFormat | undefined,
    resolve: (url: string) => string,
  ): string {
    if (outputFormat === 'json') {
      try {
        const parsed = JSON.parse(value)
        walkJsonAttrs(parsed, (src, replace) => replace(resolve(src)))
        return JSON.stringify(parsed)
      } catch {
        return value
      }
    }
    const doc = new DOMParser().parseFromString(value, 'text/html')
    doc.querySelectorAll('[src^="blob:"]').forEach((el) => {
      const src = el.getAttribute('src')
      if (src) {
        el.setAttribute('src', resolve(src))
      }
    })
    return doc.body.innerHTML
  }

  async function uploadPending(value: string, outputFormat?: OutputFormat): Promise<string> {
    const urls = collectBlobUrls(value, outputFormat)
    if (urls.length === 0) {
      return value
    }
    const remoteByUrl = new Map<string, string>()
    for (const url of urls) {
      const file = pending.get(url)
      if (!file) {
        continue
      }
      const owr = await executeUpload(toUploadFile(file), options.bucket(), executorOptions())
      remoteByUrl.set(url, resolveRemoteUrl(owr))
    }
    if (remoteByUrl.size === 0) {
      return value
    }
    const next = replaceBlobUrls(value, outputFormat, (url) => remoteByUrl.get(url) ?? url)
    for (const url of remoteByUrl.keys()) {
      pending.delete(url)
      URL.revokeObjectURL(url)
    }
    return next
  }

  return {builtinUploadFn, uploadPending}
}

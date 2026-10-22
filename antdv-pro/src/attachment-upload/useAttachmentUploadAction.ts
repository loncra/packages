import {nextTick, watch, type Ref} from 'vue'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  applyAttachmentDirectoryProgress,
  collectAttachmentFileLeaves,
  detectAttachmentValueMode,
  isObjectWriteResult,
  isUploadFile,
} from '../_util/attachmentList'
import {uploadFile as uploadAttachmentFile} from '../_util/uploadFile'
import type {AttachmentFileItem, AttachmentPathItem, AttachmentUploadExecutorOptions, AttachmentValue} from './types'
import {getObjectWriteResult} from './attachmentKinds'

/**
 * 上传动作：收集叶子 → 分"已传 / 待传" → 并发上传（进度回写目录树）→ 结果归一。
 * 上传完把内部 `fileList` 写成 `ObjectWriteResult[]`，交给 `useAttachmentUploadValue`
 * 的 `watch(fileList)` 统一 emit，避免与显式 emit 重复。
 */
export function useAttachmentUploadAction(options: {
  fileList: Ref<AttachmentFileItem[]>
  value: () => AttachmentValue | undefined
  maxCount: () => number | undefined
  bucket: () => string
  promiseLimit: () => number
  postFilename: () => string
  uploadOptions: () => Record<string, unknown> | undefined
}) {
  function buildExecutorOptions(): AttachmentUploadExecutorOptions {
    return {
      postFilename: options.postFilename(),
      promiseLimit: options.promiseLimit(),
      param: (options.uploadOptions()?.param ?? {}) as Record<string, unknown>,
      headers: (options.uploadOptions()?.headers ?? {}) as Record<string, string>,
    }
  }

  function resolveUploadResult(
    results: AttachmentFileItem[],
  ): ObjectWriteResult | ObjectWriteResult[] | undefined {
    const mode = detectAttachmentValueMode(options.value() ?? undefined, options.maxCount())
    if (mode === 'single') {
      return getObjectWriteResult(results[0] as AttachmentFileItem)
    }
    return results.map((s) => getObjectWriteResult(s)).filter((s) => s) as ObjectWriteResult[]
  }

  async function upload(): Promise<ObjectWriteResult | ObjectWriteResult[] | undefined> {
    const tree = options.fileList.value as AttachmentPathItem[]
    const leaves = collectAttachmentFileLeaves(tree)
    const existing = leaves.filter(
      (s) => isObjectWriteResult(s) || (isUploadFile(s) && s.response && s.status === 'done'),
    )
    const pending = leaves.filter(
      (item): item is UploadFile => isUploadFile(item) && !!item.originFileObj && !item.response,
    )

    if (pending.length === 0) {
      return resolveUploadResult(existing)
    }

    const stopProgressWatch = watch(
      () => pending.map((file) => [file.percent, file.status]),
      () => applyAttachmentDirectoryProgress(tree),
      {flush: 'sync'},
    )
    try {
      await Promise.all(
        pending.map(
          async (file) =>
            (file.response = await uploadAttachmentFile(
              file,
              options.bucket(),
              buildExecutorOptions(),
            )),
        ),
      )
    } finally {
      stopProgressWatch()
      applyAttachmentDirectoryProgress(tree)
    }

    const hasDirectory = tree.some((item) => item.type === 'directory')
    if (!hasDirectory) {
      const results = leaves
        .map((item) => getObjectWriteResult(item))
        .filter((item): item is ObjectWriteResult => item !== undefined)
      options.fileList.value = results
      await nextTick()
      return resolveUploadResult(results)
    }

    const results = leaves
      .map((item) => getObjectWriteResult(item))
      .filter((item): item is ObjectWriteResult => item !== undefined)
    return resolveUploadResult(results)
  }

  function getFiles(): AttachmentFileItem[] {
    return collectAttachmentFileLeaves(options.fileList.value as AttachmentPathItem[])
  }

  return {upload, getFiles, buildExecutorOptions}
}

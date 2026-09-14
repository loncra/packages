import pLimit from 'p-limit'
import {getClient} from '@loncra/client'
import {formUrlEncoded, HTTP_SUCCESS_EXECUTE_CODES, type RestResult,} from '@loncra/client/commons'
import type {MultipartUploadInitData, MultipartUploadPartData, ObjectWriteResult,} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {AttachmentUploadExecutorOptions} from '../attachment-upload'

function isUploadResultSuccess<T>(
  result: RestResult<T> | null | undefined,
): result is RestResult<T> & {data: T} {
  return (
    !!result &&
    result.status === 200 &&
    (HTTP_SUCCESS_EXECUTE_CODES as readonly string[]).includes(result.executeCode) &&
    result.data !== undefined
  )
}

function resolveUploadBlockSize(): number | undefined {
  const size = getClient().uploadBlockSize
  return typeof size === 'number' && Number.isFinite(size) ? size : undefined
}

function throwUploadError(reason: unknown, file: UploadFile): never {
  file.status = 'error'
  throw reason
}

function extractObjectWriteResult(result: RestResult<ObjectWriteResult>): ObjectWriteResult {
  if (!isUploadResultSuccess(result)) {
    throw new Error('上传响应无效')
  }
  return result.data
}

function appendFormParams(formData: FormData, options: AttachmentUploadExecutorOptions) {
  if (!options.param) {
    return
  }
  for (const key in options.param) {
    formData.append(key, String(options.param[key]))
  }
}

async function singleUpload(
  file: UploadFile,
  bucket: string,
  options: AttachmentUploadExecutorOptions,
): Promise<ObjectWriteResult> {
  const extra = {
    onUploadProgress(event: {loaded: number}) {
      if (!file.size) {
        return
      }
      file.percent = Math.floor((event.loaded * 100) / file.size)
    },
    headers: {'Content-Type': 'multipart/form-data', ...options.headers},
  }

  const formData = new FormData()
  formData.append(
    options.postFilename,
    file.originFileObj as Blob,
    (file.originFileObj as File).webkitRelativePath || file.name,
  )
  appendFormParams(formData, options)

  try {
    file.status = 'uploading'
    file.percent = 0
    const result = await AttachmentService.singleUpload(bucket, formData, extra)
    file.status = 'done'
    return extractObjectWriteResult(result)
  } catch (reason) {
    throwUploadError(reason, file)
  }
}

async function createMultipartUploadSuccess(
  initResult: RestResult<MultipartUploadInitData>,
  file: UploadFile,
  options: AttachmentUploadExecutorOptions,
): Promise<ObjectWriteResult> {
  if (!isUploadResultSuccess(initResult) || initResult.data.chunk <= 0) {
    throwUploadError('没有可使用的分片上传路径', file)
  }

  const {uploadId, chunk, uploadBlockSize} = initResult.data
  const chunks: Array<{
    id: number
    uploadSize: number
    promise: Promise<RestResult<MultipartUploadPartData>>
  }> = []

  for (let i = 1; i <= chunk; i++) {
    const nextSize = Math.min(i * uploadBlockSize, file.size || 0)
    const fileData = (file.originFileObj as Blob).slice((i - 1) * uploadBlockSize, nextSize)

    const extra = {
      onUploadProgress(event: {loaded: number}) {
        const chunkInfo = chunks.find((item) => item.id === i)
        if (!chunkInfo || !file.size) {
          return
        }
        chunkInfo.uploadSize = event.loaded
        file.percent = Math.floor(
          (chunks.reduce((sum, item) => sum + item.uploadSize, 0) * 100) / file.size,
        )
      },
    }

    const formData = new FormData()
    formData.append(
      options.postFilename,
      fileData,
      (file.originFileObj as File).webkitRelativePath || file.name,
    )
    chunks.push({
      id: i,
      uploadSize: 0,
      promise: AttachmentService.uploadMultipart(i, uploadId, formData, extra),
    })
  }

  const limit = pLimit(options.promiseLimit)
  const partResults = await Promise.all(chunks.map(({promise}) => limit(() => promise)))
  const parts = partResults.map((result: RestResult<MultipartUploadPartData>) => {
    if (!isUploadResultSuccess(result)) {
      throw new Error('分片上传响应无效')
    }
    return {id: result.data.etag, value: result.data.partNumber}
  })

  const completeResult = await AttachmentService.completeMultipartUpload(
    {uploadId, parts},
    {headers: options.headers},
  )
  file.status = 'done'
  return extractObjectWriteResult(completeResult)
}

async function multipartUpload(
  file: UploadFile,
  bucket: string,
  options: AttachmentUploadExecutorOptions,
): Promise<ObjectWriteResult> {
  const param: Record<string, unknown> = {
    objectName: (file.originFileObj as File).webkitRelativePath || file.name,
    size: file.size,
    contentType: file.type,
  }

  if (options.param) {
    Object.assign(param, options.param)
  }

  try {
    file.status = 'uploading'
    file.percent = 0
    const initResult = await AttachmentService.createMultipartUpload(bucket, formUrlEncoded(param))
    return await createMultipartUploadSuccess(initResult, file, options)
  } catch (reason) {
    throwUploadError(reason, file)
  }
}

export async function uploadFile(
  file: UploadFile,
  bucket: string,
  options: AttachmentUploadExecutorOptions,
): Promise<ObjectWriteResult> {
  if (!file?.originFileObj) {
    return Promise.reject(new Error('上传文件不能为空'))
  }

  const uploadBlockSize = resolveUploadBlockSize()
  if (uploadBlockSize == null || (file.size || 0) < uploadBlockSize) {
    return singleUpload(file, bucket, options)
  }
  return multipartUpload(file, bucket, options)
}

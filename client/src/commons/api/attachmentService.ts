import type {RestResult} from '../domain/common.ts'
import type {
  CompleteMultipartUploadBody,
  CopyFileObject,
  FileObject,
  MoveFileObject,
  MultipartUploadInitData,
  MultipartUploadPartData,
  ObjectItemInfo,
  ObjectWriteResult,
} from '../domain/attachment.ts'
import {getClient, http} from '../../http'

export class AttachmentService {
  static get BASE_URL(): string {
    const microservice = getClient().runtimeMode === 'MICROSERVICE'
    return '/api' + (microservice ? '/resource-server/attachment' : '/attachment')
  }

  static get MULTI_OBJECT_URL(): string {
    return AttachmentService.BASE_URL + '/multiObject'
  }

  static get SINGLE_UPLOAD_URL(): string {
    return AttachmentService.BASE_URL + '/upload'
  }

  static get CREATE_MULTIPART_URL(): string {
    return AttachmentService.BASE_URL + '/createMultipartUpload'
  }

  static get UPLOAD_MULTIPART(): string {
    return AttachmentService.BASE_URL + '/uploadPart'
  }

  static get COMPLETE_MULTIPART_UPLOAD_URL(): string {
    return AttachmentService.BASE_URL + '/completeMultipartUpload'
  }

  static get DELETE_ATTACHMENT_URL(): string {
    return AttachmentService.BASE_URL + '/delete'
  }

  static get BUCKETS_URL(): string {
    return AttachmentService.BASE_URL + '/buckets'
  }

  static get FIND_ATTACHMENT_URL(): string {
    return AttachmentService.BASE_URL + '/find'
  }

  static get COPY_ATTACHMENT_URL(): string {
    return AttachmentService.BASE_URL + '/copy'
  }

  static get MOVE_ATTACHMENT_URL(): string {
    return AttachmentService.BASE_URL + '/move'
  }

  static get MY_RESOURCE_URL(): string {
    return AttachmentService.BASE_URL + '/my/find'
  }

  static query(bucket: string, object: string, download = false): string {
    const token = getClient().getAccessToken?.() ?? ''
    return (
      AttachmentService.BASE_URL +
      '/' +
      bucket +
      '?objectName=' +
      object +
      '&download=' +
      download +
      '&accessToken=' +
      token
    )
  }

  static download(bucket: string, object: string): void {
    getClient().openUrl?.(this.query(bucket, object, true))
  }

  static downloads(fileObjects: FileObject[]): void {
    const token = getClient().getAccessToken?.() ?? ''
    const url =
      AttachmentService.MULTI_OBJECT_URL +
      '?json=' +
      encodeURIComponent(JSON.stringify(fileObjects)) +
      '&accessToken=' +
      token
    getClient().openUrl?.(url)
  }

  static singleUpload(
    type: string,
    formData: FormData,
    extra: object = {},
  ): Promise<RestResult<ObjectWriteResult>> {
    return http().request({
      url: AttachmentService.SINGLE_UPLOAD_URL + '/' + type,
      method: 'POST',
      data: formData,
      bodyType: 'formData',
      extra,
    })
  }

  static createMultipartUpload(
    type: string,
    param: URLSearchParams,
  ): Promise<RestResult<MultipartUploadInitData>> {
    return http().request({
      url: AttachmentService.CREATE_MULTIPART_URL + '/' + type,
      method: 'GET',
      params: param,
    })
  }

  static uploadMultipart(
    partNumber: number,
    uploadId: string,
    formData: FormData,
    extra: object = {},
  ): Promise<RestResult<MultipartUploadPartData>> {
    return http().request({
      url: AttachmentService.UPLOAD_MULTIPART + '/' + partNumber + '/' + uploadId,
      method: 'POST',
      data: formData,
      bodyType: 'formData',
      extra,
    })
  }

  static completeMultipartUpload(
    data: CompleteMultipartUploadBody,
    extra: object = {},
  ): Promise<RestResult<ObjectWriteResult>> {
    return http().request({
      url: AttachmentService.COMPLETE_MULTIPART_UPLOAD_URL,
      method: 'POST',
      data,
      bodyType: 'json',
      extra,
    })
  }

  static removeAttachment(fileObjects: FileObject[]): Promise<RestResult<void>> {
    return http().request({
      url: AttachmentService.DELETE_ATTACHMENT_URL,
      method: 'PUT',
      data: fileObjects,
      bodyType: 'json',
    })
  }

  static resourceByFileObject(file: FileObject): string {
    return AttachmentService.resource(file.bucketName, file.objectName)
  }

  static resource(bucketName: string, objectName: string): string {
    const base = getClient().resourcePath ?? ''
    return base + '/' + bucketName + '/' + objectName
  }

  static buckets(): Promise<RestResult<Record<string, unknown>[]>> {
    return http().request({
      url: AttachmentService.BUCKETS_URL,
      method: 'GET',
    })
  }

  static findAttachment(
    type: string,
    filename: string,
    recursive = false,
  ): Promise<RestResult<ObjectItemInfo[]>> {
    let url =
      AttachmentService.FIND_ATTACHMENT_URL + '?type=' + type + '&recursive=' + recursive
    if (filename) {
      url += '&filename=' + filename
    }
    return http().request({url, method: 'POST'})
  }

  static copyAttachment(copyObject: CopyFileObject): Promise<RestResult<ObjectWriteResult>> {
    return http().request({
      url: AttachmentService.COPY_ATTACHMENT_URL,
      method: 'POST',
      data: copyObject,
      bodyType: 'json',
    })
  }

  static moveAttachment(moveObject: MoveFileObject): Promise<RestResult<ObjectWriteResult>> {
    return http().request({
      url: AttachmentService.MOVE_ATTACHMENT_URL,
      method: 'POST',
      data: moveObject,
      bodyType: 'json',
    })
  }

  static myResource(type: string, filename: string): Promise<RestResult<ObjectWriteResult[]>> {
    let url = AttachmentService.MY_RESOURCE_URL + '?type=' + type
    if (filename) {
      url += '&filename=' + filename
    }
    url += '&formatObjectWriteResult=' + true + '&recursive=' + true
    return http().request({url, method: 'POST'})
  }

  static getAvatarUrlIfNotNull(item: FileObject | undefined): string | undefined {
    if (!item) {
      return undefined
    }
    return AttachmentService.query(item.bucketName, item.objectName)
  }
}

import useApp from 'antdv-next/dist/app/useApp'
import type {RestResult} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useLocale} from '../../_util/useLocale'

/**
 * 附件的下载 / 删除动作（`AttachmentPreview` 与 `AttachmentFilePreview` 共用，
 * 消掉两处近乎逐字的重复）。`postRemove` 由调用方给：列表态 = 从列表移除，
 * 单项态 = 向父级 emit `delete`。
 */
export function useAttachmentFileActions(options: {
  postRemove: (file: UploadFile<ObjectWriteResult>) => void
}) {
  const locale = useLocale('AttachmentUpload')
  const {message, modal} = useApp()

  function download(file: ObjectWriteResult): void {
    AttachmentService.download(file.bucketName, file.objectName)
  }

  async function doRemove(file: UploadFile<ObjectWriteResult>): Promise<void> {
    if (!file.response) {
      return
    }
    try {
      const result: RestResult<void> = await AttachmentService.removeAttachment([file.response])
      message.success(result.message)
      options.postRemove(file)
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    }
  }

  function confirmRemove(file: UploadFile<ObjectWriteResult>): void {
    modal.confirm({
      title: locale.value.deleteConfirmTitle,
      content: locale.value.deleteConfirmSingle,
      onOk: () => doRemove(file),
    })
  }

  /** 已上传（有 response）走确认 + 服务端删除；还没上传的直接本地移除 */
  function remove(file: UploadFile<ObjectWriteResult>): void {
    if (file.response) {
      confirmRemove(file)
    } else {
      options.postRemove(file)
    }
  }

  return {download, doRemove, remove}
}

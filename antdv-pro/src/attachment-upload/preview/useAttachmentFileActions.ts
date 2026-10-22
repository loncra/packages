import useApp from 'antdv-next/dist/app/useApp'
import type {RestResult} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {AttachmentService} from '@loncra/client/resource'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useLocale} from '../../_util/useLocale'

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

  function remove(file: UploadFile<ObjectWriteResult>): void {
    if (file.response) {
      confirmRemove(file)
    } else {
      options.postRemove(file)
    }
  }

  return {download, doRemove, remove}
}

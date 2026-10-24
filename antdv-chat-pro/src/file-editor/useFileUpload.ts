import {ref, type Ref} from 'vue'
import type {UploadChangeParam, UploadFile} from 'antdv-next'
import type {ObjectItemInfo} from '@loncra/client/resource'
import {uploadFile} from '@loncra/antdv-pro'
import type {FileEditorState} from './types'

export interface FileUploadDeps {
  state: Ref<FileEditorState>
  getBucket: () => string
  getPath: () => string
  message: {error: (content: string) => void}
  onUploaded: (target: ObjectItemInfo | undefined) => Promise<void>
}

export function useFileUpload(deps: FileUploadDeps) {
  const fileUploadTrigger = ref<HTMLElement>()
  const dirUploadTrigger = ref<HTMLElement>()
  const uploadTarget = ref<ObjectItemInfo>()

  function openUpload(directory: boolean, item?: ObjectItemInfo) {
    const trigger = directory ? dirUploadTrigger.value : fileUploadTrigger.value
    if ((item && !item.dir) || !trigger) {
      return
    }
    uploadTarget.value = item
    trigger.click()
  }

  async function onUploadChange(info: UploadChangeParam) {
    const target = uploadTarget.value
    const files = info.fileList.filter((file): file is UploadFile => !!file.originFileObj)
    if ((target && !target.dir) || files.length === 0 || deps.state.value.loading) {
      return
    }
    deps.state.value.loading = true
    try {
      await Promise.all(
        files.map((file) =>
          uploadFile(file, deps.getBucket(), {
            postFilename: 'file',
            promiseLimit: 3,
            param: {
              prefix: target?.objectName || deps.getPath(),
              randomName: false,
            },
          }),
        ),
      )
      await deps.onUploaded(target)
    } catch (e) {
      deps.message.error(e instanceof Error ? e.message : String(e))
    } finally {
      deps.state.value.loading = false
      uploadTarget.value = undefined
      deps.state.value.upload.session++
    }
  }

  return {fileUploadTrigger, dirUploadTrigger, openUpload, onUploadChange}
}
import {computed, nextTick, ref, type Ref, watch} from 'vue'
import type {UploadChangeParam} from 'antdv-next'
import {
    applyAttachmentDirectoryProgress,
    buildAttachmentPathTree,
    collectAttachmentFileLeaves,
    convertUploadFiles,
} from '../../_util/attachmentList'
import type {AttachmentFileItem, AttachmentPathItem} from '../types'

export function useAttachmentUploadFiles(fileList: Ref<AttachmentFileItem[] | undefined>) {
  const uploadFiles = ref<AttachmentPathItem[]>([])
  let syncingFromChild = false
  let ignoreAntdChange = false

  function toTree(list: AttachmentFileItem[] | undefined): AttachmentPathItem[] {
    return buildAttachmentPathTree(convertUploadFiles(Array.isArray(list) ? list : []))
  }

  watch(
    fileList,
    (list) => {
      if (syncingFromChild) {
        return
      }
      uploadFiles.value = toTree(list)
    },
    {immediate: true},
  )

  watch(
    uploadFiles,
    (list) => {
      applyAttachmentDirectoryProgress(list)
      syncingFromChild = true
      ignoreAntdChange = true
      fileList.value = list
      nextTick().then(() => {
        syncingFromChild = false
        ignoreAntdChange = false
      })
    },
    {deep: true},
  )

  const antdFileList = computed(() => collectAttachmentFileLeaves(uploadFiles.value))

  function onAntdFileListChange(info: UploadChangeParam) {
    if (ignoreAntdChange) {
      return
    }
    const incoming = info.fileList
    const current = antdFileList.value
    const same =
      incoming.length === current.length &&
      incoming.every((file, index) => file.uid === current[index]?.uid)
    if (!same) {
      uploadFiles.value = buildAttachmentPathTree(incoming)
    }
  }

  return {uploadFiles, antdFileList, onAntdFileListChange}
}

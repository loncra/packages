import {ref, type Ref, toRaw, watch} from 'vue'
import {useFormItemTrigger} from '@loncra/antdv'
import {dedupeAttachmentList, denormalizeAttachmentFromList, normalizeAttachmentToList,} from '../_util/attachmentList'
import type {AttachmentFileItem, AttachmentValue} from './types'
import {getObjectWriteResult} from './attachmentKinds'

export function useAttachmentUploadValue(options: {
  value: () => AttachmentValue | undefined
  maxCount: () => number | undefined
  dedupe: () => boolean
  onEmit: (value: AttachmentValue) => void
}): Ref<AttachmentFileItem[]> {
  const fileList = ref<AttachmentFileItem[]>([])
  let lastEmitted: AttachmentValue | undefined

  watch(
    options.value,
    (v) => {
      if (v != null && toRaw(v) === toRaw(lastEmitted)) {
        return
      }
      const list = normalizeAttachmentToList(v ?? undefined)
      fileList.value = options.dedupe() ? dedupeAttachmentList(list) : list
    },
    {immediate: true, deep: true},
  )

  watch(
    fileList,
    (list) => {
      lastEmitted = denormalizeAttachmentFromList(
        list.map((item) => getObjectWriteResult(item) ?? item),
        options.value() ?? undefined,
        options.maxCount(),
      )
      options.onEmit(lastEmitted)
    },
    {deep: true},
  )

  useFormItemTrigger(options.value, true)

  return fileList
}

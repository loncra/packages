import {ref, toRaw, watch, type Ref} from 'vue'
import {useFormItemTrigger} from '@loncra/antdv'
import {
  dedupeAttachmentList,
  denormalizeAttachmentFromList,
  normalizeAttachmentToList,
} from '../_util/attachmentList'
import type {AttachmentFileItem, AttachmentValue} from './types'
import {getObjectWriteResult} from './attachmentKinds'

/**
 * 内部 `fileList` ↔ 宿主 `value` 的双向同步。
 * 回声守卫（比 `toRaw`）与"传完交回 OWR、不交 UploadFile 外壳"两条实现约定见控件 README。
 */
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
      if (v != null && toRaw(v) === lastEmitted) {
        return
      }
      const list = normalizeAttachmentToList(v ?? undefined)
      fileList.value = options.dedupe() ? dedupeAttachmentList(list) : list
    },
    // deep：父级原地修改数组元素时也要同步进来
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

  // 值变化通知 FormItem 校验；`deep`：父级原地改数组元素也算变
  useFormItemTrigger(options.value, true)

  return fileList
}

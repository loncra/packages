import type {Ref} from 'vue'
import {useFormItemTrigger, useTwoWayModel, type ModelEmit} from '@loncra/antdv'
import {
  dedupeAttachmentList,
  denormalizeAttachmentFromList,
  normalizeAttachmentToList,
} from '../_util/attachmentList'
import type {AttachmentFileItem, AttachmentValue} from './types'
import {getObjectWriteResult} from './attachmentKinds'

export function useAttachmentUploadValue(
  props: {value?: AttachmentValue; maxCount?: number; dedupe?: boolean},
  emit: ModelEmit,
): Ref<AttachmentFileItem[]> {
  useFormItemTrigger(() => props.value, true)

  return useTwoWayModel(props, 'value', emit, {
    deep: true,
    flush: 'pre',
    toLocal: (value) => {
      const list = normalizeAttachmentToList(value ?? undefined)
      return props.dedupe ? dedupeAttachmentList(list) : list
    },
    toEmitted: (list) =>
      denormalizeAttachmentFromList(
        list.map((item) => getObjectWriteResult(item) ?? item),
        props.value ?? undefined,
        props.maxCount,
      ),
  })
}

import {getCurrentInstance, h, markRaw, type ComputedRef} from 'vue'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {
  AttachmentUpload,
  type AttachmentUploadExecutorOptions,
  type AttachmentUploadExpose,
  type AttachmentValue,
  isObjectWriteResult,
  isUploadFile,
  uploadFile,
} from '@loncra/antdv-pro'
import type {ObjectWriteResult} from '@loncra/client/resource'

export function useImFileUploadSlots(options: {
  uploadOptions: () => Record<string, unknown> | undefined
  isSending: ComputedRef<boolean>
}) {
  const {uploadOptions, isSending} = options
  const instance = getCurrentInstance()
  const uploadRefMap = new Map<string, AttachmentUploadExpose>()

  function bindUploadRef(slotKey: string, inst: unknown): void {
    if (!slotKey) {
      return
    }
    const exposed = (inst as AttachmentUploadExpose | null)?.upload
      ? (inst as AttachmentUploadExpose)
      : (inst as {exposed?: AttachmentUploadExpose} | null)?.exposed
    if (exposed?.upload) {
      uploadRefMap.set(slotKey, exposed)
    } else {
      uploadRefMap.delete(slotKey)
    }
  }

  function getUploadRef(slotKey: string): AttachmentUploadExpose | undefined {
    return uploadRefMap.get(slotKey)
  }

  function isFilesSlot(
    slot: SlotConfigType,
  ): slot is SlotConfigType & {key: string; props: {slotKind: 'files'; defaultValue?: UploadFile<ObjectWriteResult>[]}} {
    return slot.type === 'custom' && slot.props?.slotKind === 'files'
  }

  function toUploadFile(file: File): UploadFile<ObjectWriteResult> {
    return markRaw({
      uid: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      originFileObj: markRaw(file) as UploadFile<ObjectWriteResult>['originFileObj'],
    })
  }

  function originBlob(file: UploadFile<ObjectWriteResult>): Blob | undefined {
    const origin = file.originFileObj
    return origin instanceof Blob ? origin : undefined
  }

  function filesFromSlot(
    slot: SlotConfigType & {props: {defaultValue?: UploadFile<ObjectWriteResult>[]}},
  ): UploadFile<ObjectWriteResult>[] {
    const fromProps = (slot.props.defaultValue ?? []).filter(isUploadFile)
    const extra = (slot as {value?: unknown}).value
    const fromValue = Array.isArray(extra) ? extra.filter(isUploadFile) : []
    const merged = new Map<string, UploadFile<ObjectWriteResult>>()
    for (const file of [...fromValue, ...fromProps]) {
      const uid = String(file.uid)
      const prev = merged.get(uid)
      if (!prev || (!originBlob(prev) && originBlob(file))) {
        merged.set(uid, file)
      }
    }
    return [...merged.values()]
  }

  function repairOrigin(
    files: UploadFile<ObjectWriteResult>[],
    source: UploadFile<ObjectWriteResult>[],
  ): void {
    const byUid = new Map(source.map((file) => [String(file.uid), file]))
    for (const file of files) {
      if (originBlob(file)) {
        continue
      }
      const src = byUid.get(String(file.uid))
      const origin = src ? originBlob(src) : undefined
      if (origin) {
        file.originFileObj = origin as UploadFile<ObjectWriteResult>['originFileObj']
      }
    }
  }

  function buildChatUploadOptions(): AttachmentUploadExecutorOptions {
    const raw = uploadOptions() ?? {}
    return {
      postFilename: 'file',
      promiseLimit: 3,
      param: (raw.param ?? {}) as Record<string, unknown>,
      headers: (raw.headers ?? {}) as Record<string, string>,
    }
  }

  async function uploadFilesDirect(files: UploadFile<ObjectWriteResult>[]): Promise<ObjectWriteResult[]> {
    const executorOptions = buildChatUploadOptions()
    const results: ObjectWriteResult[] = []
    for (const file of files) {
      if (isObjectWriteResult(file.response) && file.status === 'done') {
        results.push(file.response)
        continue
      }
      if (!originBlob(file)) {
        continue
      }
      results.push(await uploadFile(file, 'temp', executorOptions))
    }
    return results
  }

  function asWriteResults(uploaded: ObjectWriteResult | ObjectWriteResult[] | undefined): ObjectWriteResult[] {
    return (Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : []).filter(
      (file): file is ObjectWriteResult => isObjectWriteResult(file),
    )
  }

  function resolveFilesValue(value: unknown, item: SlotConfigType): UploadFile<ObjectWriteResult>[] {
    if (Array.isArray(value) && value.some(isUploadFile)) {
      return value.filter(isUploadFile)
    }
    if (item.type === 'custom' && Array.isArray(item.props?.defaultValue)) {
      return item.props.defaultValue.filter(isUploadFile)
    }
    return []
  }

  function chipAppContext() {
    if (!instance) return undefined
    const provides = (instance as unknown as {provides: Record<PropertyKey, unknown>}).provides
    return Object.assign({}, instance.appContext, {provides})
  }

  const fileChipViews = new Map<string, {
    files: UploadFile<ObjectWriteResult>[]
    disabled: boolean
    onUpdate: (next: AttachmentValue) => void
    bindRef: (inst: unknown) => void
  }>()

  function sameFileRefs(left: UploadFile<ObjectWriteResult>[], right: UploadFile<ObjectWriteResult>[]): boolean {
    return left.length === right.length && left.every((file, index) => file === right[index])
  }

  function filesValueOf(value: unknown, item: SlotConfigType): UploadFile<ObjectWriteResult>[] {
    if (Array.isArray(value) && value.every(isUploadFile)) {
      return value
    }
    return resolveFilesValue(value, item)
  }

  function handleFilesSlotChange(
    item: SlotConfigType,
    next: AttachmentValue,
    senderOnChange: (value: AttachmentValue) => void,
  ): void {
    const files = Array.isArray(next) ? next : next ? [next] : []
    if (!('key' in item) || !item.key) {
      return
    }
    senderOnChange(files)
  }

  function fileCustomRender(
    value: UploadFile<ObjectWriteResult>[],
    onChange: (value: AttachmentValue) => void,
    _props: {disabled?: boolean; readOnly?: boolean},
    item: SlotConfigType,
  ) {
    const slotKey = 'key' in item && item.key ? item.key : ''
    const files = filesValueOf(value, item)
    const disabled = isSending.value
    let view = fileChipViews.get(slotKey)
    if (
      !view
      || view.disabled !== disabled
      || !sameFileRefs(view.files, files)
    ) {
      view = {
        files,
        disabled,
        onUpdate: (next: AttachmentValue) => handleFilesSlotChange(item, next, onChange),
        bindRef: (inst: unknown) => bindUploadRef(slotKey, inst),
      }
      fileChipViews.set(slotKey, view)
    }
    const chip = view
    const node = h(AttachmentUpload, {
      bucket: 'temp',
      disabled: chip.disabled,
      uploadOptions: uploadOptions(),
      ref: chip.bindRef,
      value: chip.files,
      multiple: true,
      maxCount: chip.files.length,
      'onUpdate:value': chip.onUpdate,
    })
    if (instance) {
      node.appContext = chipAppContext() ?? null
    }
    return node
  }

  function createFilesSlot(
    files: UploadFile<ObjectWriteResult>[],
    key: string = crypto.randomUUID(),
  ): SlotConfigType {
    return markRaw({
      type: 'custom',
      key,
      props: {slotKind: 'files', defaultValue: files.map((file) => markRaw(file))},
      customRender: fileCustomRender,
    })
  }

  return {
    isFilesSlot,
    getUploadRef,
    createFilesSlot,
    filesFromSlot,
    repairOrigin,
    uploadFilesDirect,
    asWriteResults,
    toUploadFile,
  }
}

import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {InstructionBlock, PersistableSlot, PersistableUploadFile} from '@loncra/chat-core'
import {markRaw} from 'vue'
import {convertUploadFiles, isObjectWriteResult, isUploadFile} from '@loncra/antdv-pro'

export type RestoreDraftSlotFactories = {
  /** IM 必须注入现有 createFilesSlot，否则芯片没有 customRender，点发送无法 upload。Agent 无附件槽可省略。 */
  restoreFilesSlot?: (
    files: UploadFile<ObjectWriteResult>[],
    key: string,
  ) => SlotConfigType
  restoreInstructionSlot: (block: InstructionBlock) => SlotConfigType
}

function isInstructionSlot(
  slot: SlotConfigType,
): slot is SlotConfigType & {
  type: 'custom'
  props: {slotKind: 'instruction'; prefix: string; defaultValue?: {id?: string; value?: string}}
} {
  return slot.type === 'custom' && slot.props?.slotKind === 'instruction'
}

function isFilesSlot(
  slot: SlotConfigType,
): slot is Extract<SlotConfigType, {type: 'custom'}> & {
  key?: string
  props: {slotKind: 'files'; defaultValue?: UploadFile<ObjectWriteResult>[]}
} {
  return slot.type === 'custom' && slot.props?.slotKind === 'files'
}

function asBlob(value: unknown): Blob | undefined {
  if (value instanceof Blob) {
    return value
  }
  return undefined
}

function toOriginFile(blob: Blob, meta: PersistableUploadFile): File {
  if (blob instanceof File) {
    return blob
  }
  return new File([blob], meta.name || 'file', {type: meta.type})
}

function toPersistableFile(file: UploadFile<ObjectWriteResult>): PersistableUploadFile {
  const response = isObjectWriteResult(file.response) ? file.response : undefined
  return {
    uid: String(file.uid),
    name: file.name ?? '',
    size: file.size ?? 0,
    type: file.type ?? '',
    response,
  }
}

/**
 * 活槽 → 可入库槽。丢掉 customRender（函数不能进 IDB）。
 * 文件只序列化 uid/name/size/type/response，File 走 collectBlobs。
 */
export function slotConfigToPersistable(slots: SlotConfigType[]): PersistableSlot[] {
  const result: PersistableSlot[] = []
  for (const slot of slots) {
    if (slot.type === 'text') {
      result.push({type: 'text', value: slot.value ?? ''})
      continue
    }
    if (isFilesSlot(slot)) {
      const files = (slot.props.defaultValue ?? []).filter(isUploadFile)
      result.push({
        type: 'custom',
        slotKind: 'files',
        key: String(slot.key ?? crypto.randomUUID()),
        files: files.map(toPersistableFile),
      })
      continue
    }
    if (isInstructionSlot(slot)) {
      const value = slot.props.defaultValue
      if (!value) {
        continue
      }
      result.push({
        type: 'custom',
        slotKind: 'instruction',
        key: String(slot.key ?? crypto.randomUUID()),
        prefix: slot.props.prefix,
        value: {id: String(value.id), value: String(value.value)},
      })
    }
  }
  return result
}

export function collectBlobsFromSlotConfig(slots: SlotConfigType[]): Map<string, File> {
  const blobs = new Map<string, File>()
  for (const slot of slots) {
    if (!isFilesSlot(slot)) {
      continue
    }
    for (const file of slot.props.defaultValue ?? []) {
      if (!isUploadFile(file)) {
        continue
      }
      // 只收 originFileObj；没有 File 的（例如只剩 response）不进 blobs。
      const origin = asBlob(file.originFileObj)
      if (origin) {
        blobs.set(String(file.uid), origin instanceof File ? origin : new File([origin], file.name ?? 'file', {type: file.type}))
      }
    }
  }
  return blobs
}

function persistableFileToUploadFile(
  meta: PersistableUploadFile,
  blobs: Map<string, File>,
): UploadFile<ObjectWriteResult> {
  const blob = blobs.get(meta.uid)
  if (blob) {
    // markRaw：draft 挂在响应式会话上时，Vue 不能代理 File，否则发送时 originFileObj 对不上。
    return markRaw({
      uid: meta.uid,
      name: meta.name || blob.name,
      size: meta.size || blob.size,
      type: meta.type || blob.type,
      originFileObj: markRaw(toOriginFile(blob, meta)) as UploadFile<ObjectWriteResult>['originFileObj'],
      response: meta.response,
      status: meta.response ? 'done' : undefined,
    })
  }
  if (meta.response) {
    const converted = convertUploadFiles([meta.response])
    const first = converted[0]
    if (first) {
      return markRaw(first)
    }
  }
  return markRaw({
    uid: meta.uid,
    name: meta.name,
    size: meta.size,
    type: meta.type,
    response: meta.response,
  })
}

export function persistableToSlotConfig(
  slots: PersistableSlot[],
  blobs: Map<string, File>,
  factories: RestoreDraftSlotFactories,
): SlotConfigType[] {
  const result: SlotConfigType[] = []
  for (const slot of slots) {
    if (slot.type === 'text') {
      result.push({type: 'text', value: slot.value})
      continue
    }
    if (slot.slotKind === 'files') {
      if (!factories.restoreFilesSlot) {
        // Agent 当前无附件槽；有元数据也跳过，避免 hydrate 出不能发送的死芯片。
        continue
      }
      const files = slot.files.map((file) => persistableFileToUploadFile(file, blobs))
      result.push(factories.restoreFilesSlot(files, slot.key))
      continue
    }
    result.push(
      factories.restoreInstructionSlot({
        id: slot.key,
        type: 'custom',
        slotKind: 'instruction',
        prefix: slot.prefix,
        value: slot.value,
      }),
    )
  }
  return result
}

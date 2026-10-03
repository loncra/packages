import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {PersistableSlot, PersistableUploadFile} from '@loncra/chat-core'
import {isInstructionSlot} from '@loncra/chat-core'
import {markRaw} from 'vue'
import {convertUploadFiles, isObjectWriteResult, isUploadFile} from '@loncra/antdv-pro'

/**
 * 指令块形状（`restoreInstructionSlot` 的入参）。
 *
 * ⚠️ 与宿主 `types/composables/chat.ts` 的 `InstructionBlock` **同构** —— 包边界不许引宿主类型，
 * 两边靠结构兼容对接；S3/S4 域迁入时收敛成一个名字。
 */
export interface RestoreInstructionBlock {
  id: string
  type: 'custom'
  slotKind: 'instruction'
  prefix: string
  value: IdValueMetadata<string, string>
}

export type RestoreDraftSlotFactories = {
  /** IM 必须注入现有 createFilesSlot，否则芯片没有 customRender，点发送无法 upload。Agent 无附件槽可省略。 */
  restoreFilesSlot?: (
    files: UploadFile<ObjectWriteResult>[],
    key: string,
  ) => SlotConfigType
  restoreInstructionSlot: (block: RestoreInstructionBlock) => SlotConfigType
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
 * 行内原子节点（附件 / 指令芯片）**后面必须跟一个文本节点**。
 *
 * 否则 ProseMirror 会在文本块末尾补一个 `<br class="ProseMirror-trailingBreak">`
 * —— `prosemirror-view` 的 `addTextblockHacks` 判定：
 *
 * ```js
 * if (!lastChild || !(lastChild instanceof TextViewDesc) || /\n$/.test(...)) {
 *   if ((safari || chrome) && lastChild && lastChild.dom.contentEditable == "false")
 *     this.addHackNode("IMG", parent);
 *   this.addHackNode("BR", this.top);
 * }
 * ```
 *
 * 芯片恰好是"最后一个子节点、且不是文本节点" ⇒ 那个 `<br>` 就是**换行本身** ⇒
 * **光标被挤到下一行**（2026-10-03 用户报障；宿主旧版正是靠这个占位符规避的）。
 *
 * 用**零宽空格**而不是普通空格：`\u200B` **不匹配** `\s` ⇒ 连 Gecko 那条 `/\s$/` 分支也不会触发；
 * 入库/发送前会被 `slotConfigToPersistable` 摘掉，不会把隐形字符带给后端。
 */
export const SLOT_PLACEHOLDER = '\u200B'

/**
 * 活槽 → 可入库槽。丢掉 customRender（函数不能进 IDB）。
 * 文件只序列化 uid/name/size/type/response，File 走 collectBlobs。
 * 文本槽里的编辑器占位符（`SLOT_PLACEHOLDER`）在这里摘掉。
 */
export function slotConfigToPersistable(slots: SlotConfigType[]): PersistableSlot[] {
  const result: PersistableSlot[] = []
  for (const slot of slots) {
    if (slot.type === 'text') {
      // 摘掉编辑器占位符（`SLOT_PLACEHOLDER`，只服务于 ProseMirror）；摘完为空就整块丢掉。
      const value = (slot.value ?? '').replaceAll(SLOT_PLACEHOLDER, '')
      if (!value) {
        continue
      }
      result.push({type: 'text', value})
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
  // 末尾是芯片 ⇒ 补回占位符，否则 PM 又会补那个会换行的 `<br>`（见 `SLOT_PLACEHOLDER`）
  if (result.length > 0 && result[result.length - 1]?.type === 'custom') {
    result.push({type: 'text', value: SLOT_PLACEHOLDER})
  }
  return result
}

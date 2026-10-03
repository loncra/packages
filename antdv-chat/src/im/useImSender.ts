import {computed, h, markRaw, nextTick, ref, type Ref} from 'vue'
import {Tag} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {
  AttachmentUpload,
  type AttachmentUploadExecutorOptions,
  type AttachmentUploadExpose,
  type AttachmentValue,
  convertUploadFiles,
  isObjectWriteResult,
  isUploadFile,
  uploadFile as uploadAttachmentFile,
} from '@loncra/antdv-pro'
import {isInstructionSlot} from '@loncra/chat-core'
import {ChatMessageService, type UserChatMessageResponseBody} from '@loncra/client/message'
import type {ObjectWriteResult} from '@loncra/client/resource'
import type {InstructionItem, InstructionMeasure, InstructionSenderExpose} from '../instruction-sender'
import {SLOT_PLACEHOLDER} from '../_util/draft/slots'
import type {ImConversationsApi} from './useImConversations'
import type {ImRuntime} from './useImChatContext'
import type {ImDraftApi} from './useImDraft'
import type {ImMessageListApi} from './useImMessageList'

/**
 * 发送器逻辑（迁自宿主 `composables/message-server/chat/useChatMessageSender.ts`，385 行）。
 *
 * 三块：**词槽 → 内容块**（附件先上传、指令/引用/文字各归各位）、**粘贴/表情**、**发送**。
 *
 * ⚠️ 与宿主的差异（都是"宿主依赖换包内件"，行为不变）：
 * 1. `configProviderStore` / `currentInstance` / 自建 `XProvider` **不要了** ——
 *    宿主要为附件芯片与指令芯片包一层"宿主配置实例"；模块用**环境 provider**（应用根上的那层）；
 * 2. 指令芯片的图标走 `slots.icon({type:'instruction'})`（宿主用 icon-font，模块给插槽 + 包内兜底）；
 * 3. 发送参数里的 `prefix` 由**房间**推（`user_chat_room/<roomId>`，宿主同款）；
 * 4. 发送执行（`ChatMessageService.send` + 本地入列表）**收进本 hook**（宿主在 `ChatView.vue` 里）。
 *
 * 宿主那几处踩坑注释原样保留（它们是"刷新还原后芯片能显示、点发送却不 upload"的真根因）：
 * 提交时先补 `originFileObj`、ref 缺失或 `upload()` 为空就再走 `uploadFilesDirect`。
 */
export interface UseImSenderOptions {
  runtime: ImRuntime
  /** 消息列表（唯一入口 `mergeMessage`） */
  list: ImMessageListApi
  /** 会话列表（发送成功置顶 + 更新预览） */
  conversations: ImConversationsApi
  /** 草稿（发送成功后清 IDB） */
  draft: ImDraftApi
  /** 发送器实例（`InstructionSender` 的 expose） */
  senderRef: Ref<InstructionSenderExpose | undefined>
  /** 引用条（会话级状态；由草稿持久化） */
  refMessages: Ref<UserChatMessageResponseBody[]>
}

export function useImSender(options: UseImSenderOptions) {
  const {runtime, list, conversations, draft, senderRef, refMessages} = options
  const {activeConversation, emit, slots} = runtime

  const uploadRefMap = new Map<string, AttachmentUploadExpose>()
  const uploading = ref(false)
  /** 发送中（宿主放在会话上：`conversation.sending`；模块不再往实体上挂运行态） */
  const sending = ref(false)
  const isSending = computed(() => sending.value || uploading.value)

  function getSender() {
    return senderRef.value?.getSender()
  }

  /** 附件上传参数：按**房间**给前缀（宿主 `ChatView.vue:324` 同款） */
  function getUploadOptions(): Record<string, unknown> | undefined {
    const roomId = activeConversation.value?.room?.id
    return roomId == null ? undefined : {param: {prefix: `user_chat_room/${roomId}`}}
  }

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

  function isFilesSlot(
    slot: SlotConfigType,
  ): slot is SlotConfigType & {key: string; props: {slotKind: 'files'; defaultValue?: unknown[]}} {
    return slot.type === 'custom' && slot.props?.slotKind === 'files'
  }

  /** File 进 Vue 响应式会被 Proxy，发送时对不上原 File ⇒ 粘贴 / hydrate 都走 `markRaw`（宿主原话） */
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

  /** 刷新还原后 File 在 `props.defaultValue`；运行中组件也可能写到 `slot.value` ⇒ 同 uid 优先带 `originFileObj` 的那份 */
  function filesFromSlot(
    slot: SlotConfigType & {props: {defaultValue?: unknown[]}},
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

  /** `AttachmentUpload` 内部列表可能丢了 `originFileObj` ⇒ 用槽里还原的 File 补回去，`upload()` 才读得到二进制 */
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
    const raw = getUploadOptions() ?? {}
    return {
      postFilename: 'file',
      promiseLimit: 3,
      param: (raw.param ?? {}) as Record<string, unknown>,
      headers: (raw.headers ?? {}) as Record<string, string>,
    }
  }

  /** Dexie hydrate 后 `uploadRefMap` 可能还没挂上，或 `upload()` 得到空结果 ⇒ 直接用槽里的 File 走同一套分片上传 */
  async function uploadFilesDirect(
    files: UploadFile<ObjectWriteResult>[],
  ): Promise<ObjectWriteResult[]> {
    const uploadOptions = buildChatUploadOptions()
    const results: ObjectWriteResult[] = []
    for (const file of files) {
      if (isObjectWriteResult(file.response) && file.status === 'done') {
        results.push(file.response)
        continue
      }
      if (!originBlob(file)) {
        continue
      }
      results.push(await uploadAttachmentFile(file, 'temp', uploadOptions))
    }
    return results
  }

  function asWriteResults(
    uploaded: ObjectWriteResult | ObjectWriteResult[] | undefined,
  ): ObjectWriteResult[] {
    return (Array.isArray(uploaded) ? uploaded : uploaded ? [uploaded] : []).filter(
      (file): file is ObjectWriteResult => isObjectWriteResult(file),
    )
  }

  /**
   * 空值**共用一个常量数组** —— `customRender` 每次刷新都要跑，不能每次都造新数组
   * （原因同下面的 `resolveFilesValue`）。
   */
  const EMPTY_FILES: UploadFile<ObjectWriteResult>[] = []

  /**
   * 取芯片当前的附件列表。
   *
   * ⚠️ **能保身份就必须保身份**：`AttachmentUpload` 靠 `toRaw(props.value) === lastEmitted`
   * 刹住"自己 emit 出去又被父级回传回来"的回声（见其源码 `AttachmentUpload.tsx:128-136` 的注释）。
   * 这里若习惯性 `.filter()` 造新数组，那个守卫就**永远失配** ⇒
   * `芯片刷新 → 又 emit → 我回写文档 → 文档刷新芯片 → …` **无限递归直到栈溢出**
   * （2026-10-03 实测：栈里 `useImSender.ts:237 ← :210 ← AttachmentUpload.tsx:166` 无限重复）。
   * ⇒ **只有确实要剔除非 `UploadFile` 时才产出新数组**，否则原样返回。
   */
  function resolveFilesValue(value: unknown, item: SlotConfigType): UploadFile<ObjectWriteResult>[] {
    const source: unknown[] =
      Array.isArray(value) && value.some(isUploadFile)
        ? value
        : item.type === 'custom' && Array.isArray(item.props?.defaultValue)
          ? item.props.defaultValue
          : EMPTY_FILES
    return source.every(isUploadFile)
      ? (source as UploadFile<ObjectWriteResult>[])
      : source.filter(isUploadFile)
  }

  /** 附件芯片的渲染（宿主那份外面包了一层宿主配置实例；模块直接渲染，走环境的 provider） */
  function fileCustomRender(
    value: UploadFile<ObjectWriteResult>[],
    onChange: (value: AttachmentValue) => void,
    _props: {disabled?: boolean; readOnly?: boolean},
    item: SlotConfigType,
  ) {
    const slotKey = 'key' in item && item.key ? item.key : ''
    const files = resolveFilesValue(value, item)
    return h(AttachmentUpload, {
      bucket: 'temp',
      disabled: isSending.value,
      uploadOptions: getUploadOptions(),
      ref: (inst: unknown) => bindUploadRef(slotKey, inst),
      value: files,
      multiple: true,
      maxCount: files.length,
      'onUpdate:value': (next: AttachmentValue) =>
        handleFilesSlotChange(item, next, onChange as never),
    })
  }

  /** hydrate 必须走这个工厂：`customRender` 闭包才能把芯片绑进**本实例**的 `uploadRefMap` */
  function createFilesSlot(
    files: UploadFile<ObjectWriteResult>[],
    key: string = crypto.randomUUID(),
  ): SlotConfigType {
    return markRaw({
      type: 'custom',
      key,
      props: {slotKind: 'files', defaultValue: files.map((file) => markRaw(file))},
      customRender: fileCustomRender,
    }) as SlotConfigType
  }

  /**
   * 每个芯片"最近一次回写进文档的附件内容"指纹。
   *
   * 用途：**给身份守卫兜底**。死循环的闭环是
   * `芯片刷新 → emit('update:value') → 回写文档 → 文档刷新芯片 → …`；
   * 上游（x 的节点视图 / `AttachmentUpload` 的 `[...list]`）一旦**克隆**了值，
   * `toRaw(props.value) === lastEmitted` 就失配 ⇒ 靠**内容**认出"这一轮其实没变"⇒
   * **不再回写文档** ⇒ 循环无处可续（2026-10-03 栈溢出事故）。
   * 指纹只取会影响语义的字段：uid / 名字 / 状态 / 进度 / 有无缩略图 / 有无上传结果。
   */
  const lastPushedFiles = new Map<string, string>()

  /** 芯片里可能同时有 `UploadFile` 外壳与已上传的 `ObjectWriteResult`（后者用 `etag` 当 uid） */
  interface FingerprintableFile {
    uid?: string | number
    etag?: string
    name?: string
    status?: string
    percent?: number
    thumbUrl?: string
    response?: unknown
  }

  function filesFingerprint(files: readonly unknown[]): string {
    return files
      .map((raw) => {
        const file = raw as FingerprintableFile
        const uid = file.uid ?? file.etag ?? ''
        return `${uid}|${file.name ?? ''}|${file.status ?? ''}|${file.percent ?? ''}|${
          file.thumbUrl ? 1 : 0
        }|${file.response ? 1 : 0}`
      })
      .join(',')
  }

  function handleFilesSlotChange(
    item: SlotConfigType,
    next: AttachmentValue,
    senderOnChange: (value: AttachmentValue) => void,
  ): void {
    const files = Array.isArray(next) ? next : next ? [next] : []
    const sender = getSender()
    if (!sender || !('key' in item) || !item.key) {
      return
    }
    const slotKey = String(item.key)
    const fingerprint = filesFingerprint(files)
    if (lastPushedFiles.get(slotKey) === fingerprint) {
      return
    }
    lastPushedFiles.set(slotKey, fingerprint)
    senderOnChange(files as never)
  }

  /**
   * 粘贴文件 ⇒ 造一个附件芯片插到光标处。
   *
   * ⚠️ **必须同时插一个文本占位符**：只插芯片时，它是文本块的最后一个子节点、且不是文本节点
   * ⇒ `prosemirror-view` 的 `addTextblockHacks` 会补 `<br class="ProseMirror-trailingBreak">`
   * ⇒ **光标被挤到下一行**（2026-10-03 用户报障；宿主旧版靠这个占位符规避，我漏了）。
   * 机理与选型（零宽空格）见 `SLOT_PLACEHOLDER`。
   */
  function onPasteFiles(fileList: FileList): void {
    const files = Array.from(fileList) as File[]
    if (files.length === 0) {
      return
    }
    const slot = createFilesSlot(files.map(toUploadFile))
    getSender()?.insert([slot, {type: 'text', value: SLOT_PLACEHOLDER}], 'cursor')
  }

  function onSelectedEmoji(emoji: string): void {
    getSender()?.insert([{type: 'text', value: emoji}], 'cursor')
  }

  function clear(): void {
    const sender = getSender()
    if (!sender) {
      return
    }
    sender.clear()
    lastPushedFiles.clear()
    sender.focus({cursor: 'end'})
  }

  function getSlotConfigValue(): SlotConfigType[] {
    return (getSender()?.getValue()?.slotConfig ?? []) as SlotConfigType[]
  }

  /**
   * 选中指令后造芯片（交给 `InstructionSender` 的 `createInstructionSlot` prop），
   * 草稿还原也走它 ⇒ **芯片形状只有这一处定义**（宿主原话）。
   *
   * `key` 可选：新芯片用随机 uuid，草稿还原时用**持久化时的那个 key**（宿主同分工）。
   */
  function createInstructionSlot(
    option: InstructionItem,
    measure: InstructionMeasure,
    key?: string,
  ): object {
    const prefix = String(option.metadata?.slotPrefix ?? measure.prefix)
    return {
      type: 'custom',
      key: key ?? crypto.randomUUID(),
      props: {
        slotKind: 'instruction',
        defaultValue: {id: option.id, value: option.value},
        prefix,
      },
      customRender: (
        value: {id?: string; value?: string},
        _onChange: (value: unknown) => void,
        _props: {disabled?: boolean; readOnly?: boolean},
        item: SlotConfigType,
      ) => {
        const icon = slots.icon?.({type: 'instruction'})
        return h(
          Tag,
          {key: 'key' in item && item.key ? item.key : undefined},
          {
            icon: icon ? () => icon : undefined,
            default: () => value.value,
          },
        )
      },
    }
  }

  /** 内容块 → 词槽（撤回后"重新编辑"用） */
  function convertContentBlockToSlotConfig(content: Record<string, unknown>[]): SlotConfigType[] {
    const result: SlotConfigType[] = []
    refMessages.value = []
    for (const block of content) {
      const slotKind = block.slotKind as string | undefined
      if (block.type === 'text') {
        result.push({type: 'text', value: block.value as string})
      } else if (block.type === 'custom' && slotKind === 'files') {
        result.push(createFilesSlot(convertUploadFiles(block.files as ObjectWriteResult[])))
      } else if (block.type === 'custom' && slotKind === 'reference') {
        refMessages.value = block.value as UserChatMessageResponseBody[]
      } else if (block.type === 'custom' && slotKind === 'instruction') {
        const value = block.value as {id?: string; value?: string}
        result.push(
          createInstructionSlot(
            {id: value?.id, value: value?.value ?? ''},
            {
              location: 0,
              prefix: String(block.prefix ?? ''),
              keyword: '',
              dataSource: [],
            },
          ) as SlotConfigType,
        )
      }
    }
    return result
  }

  /**
   * 提交：**词槽 → 内容块**（附件先上传、指令/引用各归各位），再交给 `send`。
   * 宿主 `handleSubmit` 逐条对应；`refMessages` 有内容时补一个 `reference` 块。
   */
  async function submit(_value: string, slotConfig?: SlotConfigType[]): Promise<void> {
    if (!slotConfig?.length) {
      return
    }
    uploading.value = true
    try {
      const blocks: Record<string, unknown>[] = []
      // 不能只信 `uploadRefMap`：刷新后芯片能显示、ref 却可能未绑上 ⇒ 点发送会只出文字、不 upload
      for (const slot of slotConfig) {
        if (isFilesSlot(slot) && slot.key) {
          const slotFiles = filesFromSlot(slot)
          const inst = uploadRefMap.get(slot.key)
          const live = inst?.getFiles?.()?.filter(isUploadFile)
          let files: ObjectWriteResult[] = []
          if (inst && live) {
            if (live.length > 0) {
              repairOrigin(live, slotFiles)
              files = asWriteResults(await inst.upload())
              if (files.length === 0) {
                files = await uploadFilesDirect(live)
              }
            }
          } else {
            files = asWriteResults(await inst?.upload())
            if (files.length === 0) {
              files = await uploadFilesDirect(slotFiles)
            }
          }
          blocks.push({id: slot.key, type: 'custom', slotKind: 'files', files})
        } else if (isInstructionSlot(slot) && slot.key) {
          const defaultValue = slot.props.defaultValue as {id?: string; value?: string}
          blocks.push({
            id: slot.key,
            type: 'custom',
            slotKind: 'instruction',
            prefix: slot.props.prefix,
            value: {id: defaultValue.id, value: defaultValue.value},
          })
        } else if (slot.type === 'text') {
          // 摘掉编辑器占位符（`SLOT_PLACEHOLDER`）：它是给 ProseMirror 用的，不该发给后端
          const value = (slot.value ?? '').replaceAll(SLOT_PLACEHOLDER, '')
          if (value) {
            blocks.push({type: 'text', value})
          }
        } else {
          blocks.push(slot as unknown as Record<string, unknown>)
        }
      }
      if (refMessages.value.length > 0) {
        blocks.push({type: 'custom', slotKind: 'reference', value: [...refMessages.value]})
      }
      await send(blocks)
      refMessages.value = []
    } finally {
      uploading.value = false
    }
  }

  /**
   * 发送（宿主 `ChatView.vue:78-105` 的 `onSendMessage`）：调接口 → **本地入列表走唯一入口** →
   * 清 IDB → 清编辑器 → 会话置顶 + 更新预览 → 清实体草稿 → 滚到底。
   *
   * ⚠️ 两处与宿主的差异：① 入列表走 `list.mergeMessage`（唯一入口，不再直接 `addBubbleListMessage`）；
   * ② 失败时**抛 `send.failed`**（宿主只 `finally` 复位 sending）。
   */
  async function send(blocks: Record<string, unknown>[]): Promise<void> {
    const roomId = activeConversation.value?.room?.id
    if (roomId == null) {
      return
    }
    sending.value = true
    try {
      const result = await ChatMessageService.send(blocks as never, String(roomId))
      const message = result?.data as UserChatMessageResponseBody | undefined
      if (!message) {
        return
      }
      // 插尾（最新一条在底部）；走唯一入口
      list.mergeMessage(message, true)
      // 发送成功再清 IDB：失败保留 ⇒ 刷新后还能重试（宿主原话）
      await draft.clearPersistedDraft()
      clear()
      conversations.moveToTopByRoomId(message.userChatRoomId, (conversation) => {
        conversation.lastUserMessage = message
      })
      const conversation = activeConversation.value
      if (conversation) {
        conversation.draft = []
      }
      await nextTick()
      runtime.view.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
    } catch (error) {
      emit({type: 'send.failed', error})
    } finally {
      sending.value = false
    }
  }

  return {
    isSending,
    sending,
    onPasteFiles,
    submit,
    onSelectedEmoji,
    clear,
    getSlotConfigValue,
    convertContentBlockToSlotConfig,
    createFilesSlot,
    createInstructionSlot,
  }
}

export type ImSenderApi = ReturnType<typeof useImSender>

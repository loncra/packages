import {computed, defineComponent, type PropType, ref, unref} from 'vue'

import {Flex, Tag, Typography} from 'antdv-next'
import type {UploadFile} from 'antdv-next/dist/upload/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {
    InstructionMeasure,
    InstructionSenderHandle,
    InstructionSenderProps
} from '@loncra/antdv-chat'
import {EmojiButton} from '@loncra/antdv-chat'
import {classNames} from '@loncra/antdv'
import {
    convertUploadFiles,
    isUploadFile,
} from '@loncra/antdv-pro'
import {getEnumName, type IdValueMetadata, isEnumValue} from '@loncra/client/commons'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE, type UserChatMessageResponseBody,} from '@loncra/client/message'
import type {DraftRestoreResult, ImContentBlock, ReferenceBlock} from '@loncra/chat-core'
import DraftSender, {type DraftSenderExpose} from '../../draft-sender'
import {createImDraftBinding} from '../draft/createImDraftBinding'
import type {ImDraftLive} from '../draft/imDraftCodec'
import type {ImPageHost} from '../host'
import {AuthServerService} from '@loncra/client/auth'
import {useLocale} from '../../_util/useLocale'
import {useImFileUploadSlots} from './useImFileUploadSlots'
import {useImInstructionSlots} from './useImInstructionSlots'
import useStyle from './style'

export interface ImSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
  convertContentBlockToSlotConfig: (content: ImContentBlock[]) => SlotConfigType[]
  createFilesSlot: (files: UploadFile<ObjectWriteResult>[], key?: string) => SlotConfigType
}

const ImSender = defineComponent({
  name: 'LImSender',
  inheritAttrs: false,
  props: {
    host: {type: Object as PropType<ImPageHost>, required: true},
    targetId: {type: String, required: true},
    refMessages: {
      type: Array as PropType<UserChatMessageResponseBody[]>,
      default: () => [],
    },
    slotConfig: Array as PropType<SlotConfigType[]>,
    placeholder: {type: String, default: ''},
    sending: {type: Boolean, default: false},
    uploadOptions: Object as PropType<Record<string, unknown>>,
    disabled: {type: Boolean, default: false},
    instructionContextVisibleMargin: {type: Number, default: 8},
    instructionMap: Object as PropType<Record<string, IdValueMetadata<string, string>[]>>,
    onFilterDataSource: Function as PropType<InstructionSenderProps['onFilterDataSource']>,
    senderInsertInstruction: Function as PropType<InstructionSenderProps['senderInsertInstruction']>,
    prefixCls: String,
    rootClass: String,
  },
  emits: {
    submit: (_blocks: ImContentBlock[]) => true,
    change: (_value: string, _event?: Event, _slotConfig?: SlotConfigType[]) => true,
    cancel: () => true,
    jumpToReference: (_message: UserChatMessageResponseBody) => true,
    'update:refMessages': (_next: UserChatMessageResponseBody[]) => true,
    appliedSlots: (_slots: SlotConfigType[]) => true,
  },
  setup(props, {slots, emit, expose}) {
    const draftRef = ref<DraftSenderExpose>()
    const antdConfig = useConfig()
    const bubbleLocale = useLocale('ImBubble')
    const prefixCls = computed(() =>
      antdConfig.value.getPrefixCls('im-sender', props.prefixCls ?? 'loncra-im-sender'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    const uploading = ref(false)
    const isSending = computed(() => unref(props.sending) || uploading.value)
    const {
      isFilesSlot,
      getUploadRef,
      createFilesSlot,
      filesFromSlot,
      repairOrigin,
      uploadFilesDirect,
      asWriteResults,
      toUploadFile,
    } = useImFileUploadSlots({
      uploadOptions: () => props.uploadOptions,
      isSending,
    })
    const {instructionSlot, createInstructionSlot} = useImInstructionSlots()

    function setRefMessages(next: UserChatMessageResponseBody[]) {
      emit('update:refMessages', next)
    }

    function onPasteFiles(fileList: FileList): void {
      const files = Array.from(fileList)
      if (files.length === 0) {
        return
      }
      const slot = createFilesSlot(files.map(toUploadFile))
      const sender = draftRef.value?.getSender()
      if (!sender) {
        return
      }
      sender.insert([slot, {type: 'text', value: ' '}], 'cursor')
    }

    async function handleSubmit(_value: string, slotConfig?: SlotConfigType[]): Promise<void> {
      if (!slotConfig?.length) {
        return
      }
      uploading.value = true
      try {
        const blocks: ImContentBlock[] = []
        for (const slot of slotConfig) {
          if (isFilesSlot(slot) && slot.key) {
            const slotFiles = filesFromSlot(slot)
            const inst = getUploadRef(slot.key)
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
            blocks.push({
              id: slot.key,
              value: files,
              type: 'custom',
              slotKind: 'files',
            })
          } else if (slot.type === 'custom' && slot.props?.slotKind === 'instruction' && slot.key) {
            blocks.push({
              id: slot.key,
              value: {id: slot.props.defaultValue.id, value: slot.props.defaultValue.value},
              type: 'custom',
              prefix: slot.props.prefix,
              slotKind: 'instruction',
            })
          } else {
            blocks.push(slot as ImContentBlock)
          }
        }
        const quoted = props.refMessages ?? []
        if (quoted.length > 0) {
          const referenceBlock: ReferenceBlock = {
            type: 'custom',
            slotKind: 'reference',
            value: quoted,
          }
          blocks.push(referenceBlock)
        }
        emit('submit', blocks)
        setRefMessages([])
      } finally {
        uploading.value = false
      }
    }

    function clear(): void {
      const sender = draftRef.value?.getSender()
      if (!sender) {
        return
      }
      sender.clear()
      sender.focus({cursor: 'end'})
    }

    function convertContentBlockToSlotConfig(content: ImContentBlock[]): SlotConfigType[] {
      const result: SlotConfigType[] = []
      let quoted: UserChatMessageResponseBody[] = []
      for (const slot of content) {
        if (slot.type === 'text') {
          result.push({type: 'text', value: slot.value})
        } else if (slot.type === 'custom' && slot.slotKind === 'files') {
          result.push(createFilesSlot(convertUploadFiles(slot.value)))
        } else if (slot.type === 'custom' && slot.slotKind === 'reference') {
          quoted = (slot as ReferenceBlock).value
        } else if (slot.type === 'custom' && slot.slotKind === 'instruction') {
          result.push(instructionSlot(slot))
        }
      }
      setRefMessages(quoted)
      return result
    }

    function readLive(): ImDraftLive {
      return {
        slots: draftRef.value?.getSlotConfigValue() ?? props.slotConfig ?? [],
        refMessages: [...(props.refMessages ?? [])],
      }
    }

    function slotsOf(live: unknown): SlotConfigType[] {
      return (live as ImDraftLive).slots
    }

    function onRestore(result: DraftRestoreResult<unknown, SlotConfigType[]>): void {
      const live = result.live as ImDraftLive | null
      if (!result.found || !live) {
        setRefMessages([])
        return
      }
      setRefMessages([...live.refMessages])
      if (result.applySlots && result.slots) {
        emit('appliedSlots', result.slots)
      }
    }

    const binding = createImDraftBinding({
      principal: () => props.host.self.systemName,
      targetId: () => props.targetId,
      factories: {
        restoreFilesSlot: (files, key) => createFilesSlot(files, key),
        restoreInstructionSlot: (block) => instructionSlot(block),
      },
    })

    function insertInstruction(
      sender: InstructionSenderHandle,
      block: object,
      measure: InstructionMeasure,
    ) {
      if (props.senderInsertInstruction) {
        props.senderInsertInstruction(sender, block, measure)
        return
      }
      sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
    }

    function filterInstruction(
      keyword: string,
      dataSource: IdValueMetadata<string, string>[],
      prefix: string,
    ) {
      return props.onFilterDataSource
        ? props.onFilterDataSource(keyword, dataSource, prefix)
        : dataSource
    }

    function onEmoji(emoji: string) {
      draftRef.value?.getSender()?.insert([{type: 'text', value: emoji}], 'cursor')
    }

    function closeReference(message: UserChatMessageResponseBody) {
      setRefMessages((props.refMessages ?? []).filter((item) => item.id !== message.id))
    }

    expose({
      flush: () => draftRef.value?.flush() ?? Promise.resolve(),
      clearStored: () => draftRef.value?.clearStored() ?? Promise.resolve(),
      clear,
      getSlotConfigValue: () => draftRef.value?.getSlotConfigValue() ?? [],
      getSender: () => draftRef.value?.getSender(),
      convertContentBlockToSlotConfig,
      createFilesSlot,
    })

    return () => {
      const messages = props.refMessages ?? []
      const barClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        `${prefixCls.value}-references`,
      )
      return (
        <DraftSender
          ref={draftRef}
          binding={binding}
          readLive={readLive}
          slotsOf={slotsOf}
          onRestore={onRestore}
          saveSource={messages}
          slotConfig={props.slotConfig}
          placeholder={props.placeholder}
          sending={isSending.value}
          disabled={props.disabled}
          instructionContextVisibleMargin={props.instructionContextVisibleMargin}
          instructionMap={props.instructionMap}
          onFilterDataSource={filterInstruction}
          senderInsertInstruction={insertInstruction}
          createInstructionSlot={createInstructionSlot}
          onPasteFile={onPasteFiles}
          onSubmit={(value: string, slotConfig?: SlotConfigType[]) => handleSubmit(value, slotConfig)}
          onChange={(value: string, event?: Event, slotConfig?: SlotConfigType[]) =>
            emit('change', value, event, slotConfig)
          }
          onCancel={() => emit('cancel')}
          v-slots={{
            header:
              messages.length > 0
                ? () => (
                    <Flex class={barClass} gap="small" wrap="wrap">
                      {messages.map((message) => {
                        const owner = message.participant?.type
                        const notMember = owner != null
                          && !isEnumValue(owner, MESSAGE_SERVER_USER_CHAT_PARTICIPANT_TYPE.MEMBER)
                        const mine = message.principal === props.host.self.systemName
                        return (
                          <span key={String(message.id)} class={`${prefixCls.value}-reference`}>
                            <Tag
                              variant="outlined"
                              closable
                              class={`${prefixCls.value}-chip`}
                              color={notMember ? 'gold' : undefined}
                              onClick={() => emit('jumpToReference', message)}
                              onClose={() => closeReference(message)}
                            >
                              <Flex class={`${prefixCls.value}-chip-body`} align="center" gap={0}>
                                <Typography.Text class={`${prefixCls.value}-chip-name`}>
                                  {notMember ? `[${getEnumName(owner)}]` : ''}
                                  {mine
                                    ? bubbleLocale.value.me
                                    : `[${AuthServerService.getPrincipalNameByUserDetails(message.participant?.metadata?.details)}]`}
                                  :
                                </Typography.Text>
                                <Typography.Text
                                  class={`${prefixCls.value}-chip-preview`}
                                  type="secondary"
                                  ellipsis
                                >
                                  {props.host.messagePreview(message)}
                                </Typography.Text>
                              </Flex>
                            </Tag>
                          </span>
                        )
                      })}
                    </Flex>
                  )
                : undefined,
            leftExtra: () => [
              <EmojiButton type="text" disabled={isSending.value} onSelected={onEmoji} />,
              slots.leftExtra?.(),
            ],
            rightExtra: slots.rightExtra ? () => slots.rightExtra?.() : undefined,
            instructionItemRender: slots.instructionItemRender
              ? (slotProps: {index: number; item: unknown; prefix: string}) =>
                  slots.instructionItemRender?.(slotProps)
              : undefined,
            instructionListRender: slots.instructionListRender,
            defaultButton: slots.defaultButton,
          }}
        />
      )
    }
  },
})

export default ImSender

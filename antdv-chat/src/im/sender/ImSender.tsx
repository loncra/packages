import {computed, defineComponent, type PropType, ref} from 'vue'
import {Flex} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {DraftRestoreResult} from '@loncra/chat-core'
import {classNames} from '@loncra/antdv'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import DraftSender, {type DraftSenderExpose} from '../../draft-sender/DraftSender'
import type {DraftBinding} from '../../draft-sender/useDraftSender'
import EmojiButton from '../../emoji-button/EmojiButton'
import type {InstructionSenderProps} from '../../instruction-sender/InstructionSender'
import type {InstructionSenderHandle} from '../../instruction-sender/types'
import useStyle from './style'

/** 引用条只认 id，芯片内容由宿主插槽画。 */
export interface ImSenderReferenceItem {
  id?: string | number
}

export interface ImSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
}

const ImSender = defineComponent({
  name: 'LImSender',
  inheritAttrs: false,
  props: {
    binding: {type: Object as PropType<DraftBinding<any>>, required: true},
    readLive: {type: Function as PropType<() => unknown>, required: true},
    slotsOf: {type: Function as PropType<(live: unknown) => SlotConfigType[]>, required: true},
    onRestore: {
      type: Function as PropType<(result: DraftRestoreResult<unknown, SlotConfigType[]>) => void>,
      required: true,
    },
    saveSource: {default: undefined as unknown},
    refMessages: {
      type: Array as PropType<ImSenderReferenceItem[]>,
      default: () => [],
    },
    onFilterDataSource: {
      type: Function as PropType<InstructionSenderProps['onFilterDataSource']>,
      required: true,
    },
    senderInsertInstruction: {
      type: Function as PropType<InstructionSenderProps['senderInsertInstruction']>,
      required: true,
    },
    createInstructionSlot: {
      type: Function as PropType<InstructionSenderProps['createInstructionSlot']>,
      required: true,
    },
    slotConfig: Array as PropType<SlotConfigType[]>,
    prefixCls: String,
    rootClass: String,
  },
  emits: ['pasteFile', 'submit', 'change', 'cancel'],
  setup(props, {attrs, slots, emit, expose}) {
    const draftRef = ref<DraftSenderExpose>()
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('im-sender', props.prefixCls ?? 'loncra-im-sender'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    function onEmoji(emoji: string) {
      draftRef.value?.getSender()?.insert([{type: 'text', value: emoji}], 'cursor')
    }

    expose({
      flush: () => draftRef.value?.flush() ?? Promise.resolve(),
      clearStored: () => draftRef.value?.clearStored() ?? Promise.resolve(),
      clear: () => draftRef.value?.clear(),
      getSlotConfigValue: () => draftRef.value?.getSlotConfigValue() ?? [],
      getSender: () => draftRef.value?.getSender(),
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
          {...attrs}
          ref={draftRef}
          binding={props.binding}
          readLive={props.readLive}
          slotsOf={props.slotsOf}
          onRestore={props.onRestore}
          saveSource={props.saveSource}
          slotConfig={props.slotConfig}
          onFilterDataSource={props.onFilterDataSource}
          senderInsertInstruction={props.senderInsertInstruction}
          createInstructionSlot={props.createInstructionSlot}
          onPasteFile={(fileList: FileList) => emit('pasteFile', fileList)}
          onSubmit={(value: string, slotConfig?: SlotConfigType[]) => emit('submit', value, slotConfig)}
          onChange={(value: string, event?: Event, slotConfig?: SlotConfigType[]) =>
            emit('change', value, event, slotConfig)
          }
          onCancel={() => emit('cancel')}
          v-slots={{
            header:
              messages.length > 0
                ? () => (
                    <Flex class={barClass} gap="small" wrap="wrap">
                      {messages.map((message) => (
                        <span key={String(message.id)} class={`${prefixCls.value}-reference`}>
                          {slots.reference?.({message})}
                        </span>
                      ))}
                    </Flex>
                  )
                : undefined,
            leftExtra: () => [
              <EmojiButton type="text" disabled={Boolean(attrs.sending)} onSelected={onEmoji} />,
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

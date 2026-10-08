import {defineComponent, type PropType, ref, shallowRef, watch} from 'vue'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {DraftRestoreResult} from '@loncra/chat-core'
import {
  InstructionSender,
  type InstructionSenderExpose,
  type InstructionSenderHandle,
  type InstructionSenderProps,
} from '@loncra/antdv-chat'
import {type DraftBinding, useDraftSender} from './useDraftSender'

export interface DraftSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
}

const DraftSender = defineComponent({
  name: 'LDraftSender',
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
  },
  emits: ['change', 'pasteFile', 'submit', 'cancel'],
  setup(props, {attrs, slots, emit, expose}) {
    const slotsState = shallowRef<SlotConfigType[]>([...(props.slotConfig ?? [])])
    const innerRef = ref<InstructionSenderExpose>()

    const {schedule, flush, clearStored} = useDraftSender<unknown>({
      slots: slotsState,
      binding: () => props.binding,
      readLive: () => props.readLive(),
      slotsOf: (live) => props.slotsOf(live),
      onRestore: (result) => props.onRestore(result),
      saveSource: () => props.saveSource,
    })

    watch(
      () => props.slotConfig,
      (next) => {
        const incoming = next ?? []
        if (incoming !== slotsState.value) {
          slotsState.value = incoming
          schedule()
        }
      },
    )

    expose({
      flush,
      clearStored,
      clear: () => innerRef.value?.clear(),
      getSlotConfigValue: () => innerRef.value?.getSlotConfigValue() ?? [],
      getSender: () => innerRef.value?.getSender(),
    })

    return () => {
      const {onChange: _onChange, onPasteFile: _onPasteFile, ...rest} = attrs
      return (
        <InstructionSender
          {...rest}
          ref={innerRef}
          slotConfig={slotsState.value}
          onFilterDataSource={props.onFilterDataSource}
          senderInsertInstruction={props.senderInsertInstruction}
          createInstructionSlot={props.createInstructionSlot}
          onChange={(value: string, event?: Event, slotConfig?: SlotConfigType[]) => {
            schedule()
            emit('change', value, event, slotConfig)
          }}
          onPasteFile={(fileList: FileList) => {
            schedule()
            emit('pasteFile', fileList)
          }}
          onSubmit={(value: string, slotConfig?: SlotConfigType[]) => emit('submit', value, slotConfig)}
          onCancel={() => emit('cancel')}
          v-slots={slots}
        />
      )
    }
  },
})

export default DraftSender

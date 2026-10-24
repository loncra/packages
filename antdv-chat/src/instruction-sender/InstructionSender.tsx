import {
    computed,
    defineComponent,
    h,
    type PropType,
    type Ref,
    ref,
    toRef,
    unref
} from 'vue'
import {Flex, Space} from 'antdv-next'
import {Sender} from '@antdv-next/x'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {
  InstructionItem,
  InstructionSenderClasses,
  InstructionSenderHandle,
  InstructionSenderProps,
  InstructionSenderStyles,
} from './types'
import InstructionSenderPanel from './InstructionSenderPanel'
import {useInstructionSender} from './useInstructionSender'
import useStyle from './style'

const EMPTY_SLOT_CONFIG: SlotConfigType[] = []

const InstructionSender = defineComponent({
  name: 'LInstructionSender',
  inheritAttrs: false,
  props: {
    slotConfig: Array as PropType<SlotConfigType[]>,
    placeholder: {
      type: String,
      default: '',
    },
    sending: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    instructionContextVisibleMargin: {
      type: Number,
      default: 8,
    },
    instructionMap: {
      type: Object as PropType<Record<string, InstructionItem[]>>,
      default: () => ({}),
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
    inputClass: String,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<InstructionSenderClasses>,
    styles: Object as PropType<InstructionSenderStyles>,
  },
  emits: ['submit', 'cancel', 'change', 'pasteFile'],
  setup(props, {emit, slots, attrs, expose}) {
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('instruction-sender', props.prefixCls ?? 'loncra-instruction-sender'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const senderRef = ref<SenderRef>()
    const isSending = toRef(props, 'sending')
    const {
      instructionPopoverRef,
      handleSenderChange,
      handleSenderKeyDown,
      handleInstructionPick,
      instructionOption,
    } = useInstructionSender({
      instructionMap: toRef(props, 'instructionMap'),
      contextVisibleMargin: toRef(props, 'instructionContextVisibleMargin'),
      disabled: toRef(props, 'disabled'),
      senderRef: senderRef as Ref<InstructionSenderHandle | undefined>,
      onFilterDataSource: props.onFilterDataSource,
      senderInsertInstruction: props.senderInsertInstruction,
      createInstructionSlot: props.createInstructionSlot,
    })

    function clear(): void {
      const sender = senderRef.value
      if (!sender) {
        return
      }
      sender.clear()
      sender.focus({cursor: 'end'})
    }

    function getSlotConfigValue(): SlotConfigType[] {
      return senderRef.value?.getValue()?.slotConfig || []
    }

    function getSender(): InstructionSenderHandle | undefined {
      return senderRef.value as InstructionSenderHandle | undefined
    }

    async function onChange(value: string, event?: Event, slotConfig?: SlotConfigType[]) {
      await handleSenderChange(value, event, slotConfig)
      emit('change', value, event, slotConfig)
    }

    expose({
      clear,
      getSlotConfigValue,
      getSender,
      senderRef: senderRef as Ref<InstructionSenderHandle | undefined>,
    })

    return () => {
      const {class: attrClass, style: attrStyle, ...rest} = attrs
      const hashedClass = classNames(prefixCls.value, hashId.value, cssVarCls.value)
      const option = instructionOption.value
      const sending = unref(isSending)

      return (
        <>
          <Sender
            {...rest}
            ref={senderRef}
            slotConfig={
              props.disabled
                ? undefined
                : (props.slotConfig ?? EMPTY_SLOT_CONFIG)
            }
            suffix={false}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={sending || props.disabled}
            class={classNames(hashedClass, props.rootClass, attrClass)}
            style={attrStyle as never}
            classes={{
              ...props.classes?.sender,
              input: classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-input`,
                props.inputClass,
                props.classes?.sender?.input,
              ),
              footer: classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-footer`,
                props.classes?.sender?.footer,
              ),
            }}
            styles={props.styles?.sender as never}
            header={slots.header ? () => slots.header?.() : undefined}
            footer={
              props.disabled
                ? undefined
                : ((_oriNode, info) => {
                    const components = info.components
                    return (
                      <Flex justify="space-between" align="center" gap="small">
                        <Space>{slots.leftExtra?.()}</Space>
                        <Flex align="center" gap="small">
                          {slots.rightExtra?.()}
                          {slots.defaultButton?.({components}) ?? [
                            h(components.ClearButton, {disabled: sending, onClick: clear}),
                            h(sending ? components.LoadingButton : components.SendButton, {
                              disabled: sending,
                              type: 'primary',
                            }),
                          ]}
                        </Flex>
                      </Flex>
                    )
                  })
            }
            onCancel={() => emit('cancel')}
            onChange={onChange}
            onPasteFile={(fileList: FileList) => emit('pasteFile', fileList)}
            onKeyDown={handleSenderKeyDown}
            onSubmit={(value: string, slotConfig?: SlotConfigType[]) =>
              emit('submit', value, slotConfig)
            }
          />
          <InstructionSenderPanel
            popoverRef={instructionPopoverRef}
            open={option.open && option.displayDataSource.length > 0}
            hashedClass={hashedClass}
            prefixCls={prefixCls.value}
            prefix={option.measure.prefix}
            items={option.displayDataSource}
            activeIndex={option.activeIndex}
            pick={handleInstructionPick}
            highlight={(index: number) => {
              instructionOption.value.activeIndex = index
            }}
            popoverClasses={{
              ...props.classes?.popover,
              root: classNames(hashedClass, props.classes?.popover?.root),
              content: classNames(hashedClass, props.classes?.popover?.content),
            }}
            popoverStyles={props.styles?.popover as never}
            panelClass={props.classes?.panel}
            panelStyle={props.styles?.panel as never}
            itemClass={props.classes?.item}
            itemStyle={props.styles?.item as never}
            anchorClass={props.classes?.anchor}
            anchorStyle={{...props.styles?.anchor, ...option.anchorStyle} as never}
            v-slots={{list: slots.instructionListRender, item: slots.instructionItemRender}}
          />
        </>
      )
    }
  },
})

export default InstructionSender

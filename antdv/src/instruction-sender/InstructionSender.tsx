import {
    computed,
    defineComponent,
    getCurrentInstance,
    h,
    type PropType,
    type Ref,
    ref,
    Teleport,
    toRef,
    unref
} from 'vue'
import {Flex, Popover, Space} from 'antdv-next'
import {Sender} from '@antdv-next/x'
import type {ActionsComponents, SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '../_util/classNames'
import {createInstructionTagSlot} from './slot'
import type {InstructionItem, InstructionMeasure, InstructionSenderHandle} from './types'
import {useInstructionSender} from './useInstructionSender'
import useStyle from './style'

const EMPTY_SLOT_CONFIG: SlotConfigType[] = []

function defaultFilterInstruction(
  _keyword: string,
  dataSource: InstructionItem[],
): InstructionItem[] {
  return dataSource
}

function defaultInsertInstruction(
  sender: InstructionSenderHandle,
  block: object,
  measure: InstructionMeasure,
) {
  sender.insert([block, {type: 'text', value: ' '}], 'cursor', measure.prefix + measure.keyword)
}

export type {
  InstructionItem,
  InstructionMeasure,
  InstructionPopoverState,
  InstructionSenderHandle,
  InstructionSlotProps,
  UseInstructionSenderParams,
} from './types'

export interface InstructionSenderProps {
  slotConfig?: object[]
  placeholder?: string
  sending?: boolean
  disabled?: boolean
  instructionContextVisibleMargin?: number
  instructionMap?: Record<string, InstructionItem[]>
  filterInstruction?: (
    keyword: string,
    dataSource: InstructionItem[],
    prefix: string,
  ) => InstructionItem[]
  senderInsertInstruction?: (
    sender: InstructionSenderHandle,
    block: object,
    measure: InstructionMeasure,
  ) => void
  getInstructionIcon?: (prefix: string) => string | undefined
  inputClass?: string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
  classNames?: Record<string, string>
  styles?: Record<string, unknown>
}

export interface InstructionSenderEmits {
  submit: (value: string, slotConfig?: object[]) => void
  cancel: () => void
  change: (value: string, event?: Event, slotConfig?: object[]) => void
  pasteFile: (fileList: FileList) => void
}

export interface InstructionSenderSlots {
  header?: () => unknown
  leftExtra?: () => unknown
  rightExtra?: () => unknown
  defaultButton?: (props: {components: ActionsComponents}) => unknown
  instructionItemRender?: (props: {
    index: number
    item: InstructionItem
    prefix: string
  }) => unknown
  instructionListRender?: (props: {
    items: InstructionItem[]
    prefix: string
    activeIndex: number
    pick: (item: InstructionItem) => void
  }) => unknown
}

export interface InstructionSenderExpose {
  clear: () => void
  getSlotConfigValue: () => any[]
  getSender: () => InstructionSenderHandle | undefined
  senderRef: Ref<InstructionSenderHandle | undefined>
}

const InstructionSender = defineComponent({
  name: 'LInstructionSender',
  inheritAttrs: false,
  props: {
    slotConfig: Array as PropType<object[]>,
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
    filterInstruction: {
      type: Function as PropType<InstructionSenderProps['filterInstruction']>,
      default: defaultFilterInstruction,
    },
    senderInsertInstruction: {
      type: Function as PropType<InstructionSenderProps['senderInsertInstruction']>,
      default: defaultInsertInstruction,
    },
    getInstructionIcon: Function as PropType<InstructionSenderProps['getInstructionIcon']>,
    inputClass: {
      type: String,
      default: 'chat-sender-input',
    },
    prefixCls: String,
    rootClass: String,
    classNames: Object as PropType<Record<string, string>>,
    styles: Object as PropType<Record<string, unknown>>,
  },
  emits: ['submit', 'cancel', 'change', 'pasteFile'],
  setup(props, {emit, slots, attrs, expose}) {
    const instance = getCurrentInstance()
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
      onFilterDataSource: (keyword, dataSource, prefix) =>
        (props.filterInstruction ?? defaultFilterInstruction)(keyword, dataSource, prefix),
      senderInsertInstruction: (sender, block, measure) =>
        (props.senderInsertInstruction ?? defaultInsertInstruction)(sender, block, measure),
      createInstructionSlot: (option, measure) =>
        createInstructionTagSlot(
          {
            id: String(crypto.randomUUID()),
            value: option,
            prefix: String(option.metadata?.slotPrefix ?? measure.prefix),
          },
          props.getInstructionIcon,
          instance?.appContext,
        ),
    })

    function clear(): void {
      const sender = senderRef.value
      if (!sender) {
        return
      }
      sender.clear()
      sender.focus({cursor: 'end'})
    }

    function getSlotConfigValue(): any[] {
      return senderRef.value?.getValue()?.slotConfig || []
    }

    function getSender(): InstructionSenderHandle | undefined {
      return senderRef.value as InstructionSenderHandle | undefined
    }

    async function onChange(value: string, event?: Event, slotConfig?: object[]) {
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
                : ((props.slotConfig ?? EMPTY_SLOT_CONFIG) as SlotConfigType[])
            }
            suffix={false}
            placeholder={props.placeholder}
            disabled={props.disabled}
            readOnly={sending || props.disabled}
            class={classNames(hashedClass, props.rootClass, attrClass)}
            style={attrStyle as never}
            classNames={{
              ...props.classNames,
              input: classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-input`,
                props.inputClass,
                props.classNames?.input,
              ),
              footer: classNames(
                hashId.value,
                cssVarCls.value,
                `${prefixCls.value}-footer`,
                props.classNames?.footer,
              ),
            }}
            styles={props.styles as never}
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
              emit('submit', value, slotConfig as object[] | undefined)
            }
          />
          <Teleport to="body">
            <Popover
              ref={instructionPopoverRef as never}
              open={option.open && option.displayDataSource.length > 0}
              trigger={[]}
              destroyOnHidden={false}
              class={hashedClass}
              rootClass={hashedClass}
              classes={{root: hashedClass, content: hashedClass}}
              v-slots={{
                content: () => (
                  <div
                    class={classNames(hashedClass, `${prefixCls.value}-panel`)}
                    onMousedown={(e: MouseEvent) => e.preventDefault()}
                  >
                    {slots.instructionListRender
                      ? slots.instructionListRender({
                          items: option.displayDataSource,
                          prefix: option.measure.prefix,
                          activeIndex: option.activeIndex,
                          pick: handleInstructionPick,
                        })
                      : option.displayDataSource.map((item, index) => (
                          <div
                            key={item.id ?? index}
                            class={classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-item`, {
                              [`${prefixCls.value}-item-active`]: index === option.activeIndex,
                            })}
                            onMouseenter={() => {
                              instructionOption.value.activeIndex = index
                            }}
                            onClick={() => handleInstructionPick(item)}
                          >
                            {slots.instructionItemRender
                              ? slots.instructionItemRender({
                                  index,
                                  item,
                                  prefix: option.measure.prefix,
                                })
                              : item.value}
                          </div>
                        ))}
                  </div>
                ),
              }}
            >
              <span
                class={classNames(hashedClass, `${prefixCls.value}-anchor`)}
                style={option.anchorStyle}
              />
            </Popover>
          </Teleport>
        </>
      )
    }
  },
})

export default InstructionSender

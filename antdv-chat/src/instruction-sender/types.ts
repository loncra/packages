import type {CSSProperties, Ref} from 'vue'
import type {PopoverProps} from 'antdv-next'
import type {ActionsComponents, SenderProps, SlotConfigType} from '@antdv-next/x/dist/sender/interface'

export interface InstructionItem {
  id?: string
  value: string
  metadata?: Record<string, unknown>
}

export interface InstructionMeasure {
  location: number
  prefix: string
  keyword: string
  dataSource: InstructionItem[]
}

export interface InstructionPopoverState {
  open: boolean
  measure: InstructionMeasure
  activeIndex: number
  anchorStyle: Record<string, string>
  displayDataSource: InstructionItem[]
}

export interface InstructionSenderHandle {
  nativeElement: HTMLDivElement
  focus: (options?: {cursor?: string; key?: string}) => void
  blur: () => void
  clear: () => void
  insert: (
    value: string | object[],
    position?: 'start' | 'end' | 'cursor',
    replaceCharacters?: string,
  ) => void
  getValue: () => {value: string; slotConfig?: object[]}
}

export interface UseInstructionSenderParams {
  instructionMap: Ref<Record<string, InstructionItem[]>>
  disabled: Ref<boolean>
  senderRef: Ref<InstructionSenderHandle | undefined>
  contextVisibleMargin: Ref<number>
  onFilterDataSource: (
    keyword: string,
    dataSource: InstructionItem[],
    prefix: string,
  ) => InstructionItem[]
  senderInsertInstruction: (
    sender: InstructionSenderHandle,
    block: object,
    measure: InstructionMeasure,
  ) => void
  createInstructionSlot: (option: InstructionItem, measure: InstructionMeasure) => object
}

export interface InstructionSenderProps {
  slotConfig?: SlotConfigType[]
  placeholder?: string
  sending?: boolean
  disabled?: boolean
  instructionContextVisibleMargin?: number
  instructionMap?: Record<string, InstructionItem[]>
  onFilterDataSource: (
    keyword: string,
    dataSource: InstructionItem[],
    prefix: string,
  ) => InstructionItem[]
  senderInsertInstruction: (
    sender: InstructionSenderHandle,
    block: object,
    measure: InstructionMeasure,
  ) => void
  createInstructionSlot: (option: InstructionItem, measure: InstructionMeasure) => object
  inputClass?: string
  prefixCls?: string
  class?: unknown
  rootClass?: string
  style?: unknown
  classes?: InstructionSenderClasses
  styles?: InstructionSenderStyles
}

export interface InstructionSenderEmits {
  submit: (value: string, slotConfig?: SlotConfigType[]) => void
  cancel: () => void
  change: (value: string, event?: Event, slotConfig?: SlotConfigType[]) => void
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
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
  senderRef: Ref<InstructionSenderHandle | undefined>
}

export interface InstructionSenderClasses {
  sender?: SenderProps['classes']
  popover?: Exclude<PopoverProps['classes'], Function>
  panel?: string
  item?: string
  anchor?: string
}

export interface InstructionSenderStyles {
  sender?: SenderProps['styles']
  popover?: PopoverProps['styles']
  panel?: CSSProperties
  item?: CSSProperties
  anchor?: CSSProperties
}

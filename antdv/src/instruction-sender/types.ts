import type {Ref} from 'vue'

export interface InstructionItem {
  id?: string
  value: string
  metadata?: Record<string, unknown>
}

export type InstructionSlotProps = {
  slotKind: 'instruction'
  defaultValue: InstructionItem
  prefix: string
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

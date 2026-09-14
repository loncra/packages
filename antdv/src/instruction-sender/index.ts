import InstructionSender from './InstructionSender'

export default InstructionSender
export type {
  InstructionSenderEmits,
  InstructionSenderExpose,
  InstructionSenderProps,
  InstructionSenderSlots,
} from './InstructionSender'
export type {
  InstructionItem,
  InstructionMeasure,
  InstructionPopoverState,
  InstructionSenderHandle,
  InstructionSlotProps,
  UseInstructionSenderParams,
} from './types'
export {createInstructionTagSlot, isInstructionSlot} from './slot'
export {useInstructionSender} from './useInstructionSender'
export type {InstructionSenderApi} from './useInstructionSender'

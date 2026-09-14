import {type AppContext, h, type VNode} from 'vue'
import {Tag} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {renderIconFont} from '../_util/iconFont'
import type {InstructionItem, InstructionSlotProps} from './types'

export function isInstructionSlot(
  slot: unknown,
): slot is {type: 'custom'; props: InstructionSlotProps} {
  if (!slot || typeof slot !== 'object') {
    return false
  }
  const value = slot as {type?: string; props?: {slotKind?: unknown}}
  return value.type === 'custom' && value.props?.slotKind === 'instruction'
}

export function createInstructionTagSlot(
  slot: {id: string; value: InstructionItem; prefix: string},
  getInstructionIcon?: (prefix: string) => string | undefined,
  appContext?: AppContext,
): SlotConfigType {
  return {
    type: 'custom',
    key: slot.id,
    props: {slotKind: 'instruction', defaultValue: slot.value, prefix: slot.prefix},
    customRender: (value: InstructionItem) => {
      const iconType = getInstructionIcon?.(slot.prefix)
      const node = h(
        Tag,
        {variant: 'outlined'},
        {
          icon: iconType ? () => renderIconFont(iconType) : undefined,
          default: () => value.value,
        },
      ) as VNode
      if (appContext) {
        node.appContext = appContext
      }
      return node
    },
  }
}

import {getCurrentInstance, h} from 'vue'
import {Tag} from 'antdv-next'
import {UserOutlined} from '@antdv-next/icons'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionItem, InstructionMeasure} from '@loncra/antdv-chat'
import type {IdValueMetadata} from '@loncra/client/commons'
import type {InstructionBlock} from '@loncra/chat-core'

export function useImInstructionSlots() {
  const instance = getCurrentInstance()

  function chipAppContext() {
    if (!instance) return undefined
    const provides = (instance as unknown as {provides: Record<PropertyKey, unknown>}).provides
    return Object.assign({}, instance.appContext, {provides})
  }

  function instructionSlot(block: InstructionBlock): SlotConfigType {
    return {
      type: 'custom',
      key: block.id,
      props: {slotKind: 'instruction', defaultValue: block.value, prefix: block.prefix},
      customRender: (
        value: IdValueMetadata<string, string>,
        _onChange: (next: IdValueMetadata<string, string>) => void,
        _slotProps: {disabled?: boolean; readOnly?: boolean},
        item: SlotConfigType,
      ) => {
        const slotKey = 'key' in item && item.key ? item.key : ''
        const prefix = item.type === 'custom'
          ? (item.props as {prefix?: string} | undefined)?.prefix ?? ''
          : ''
        const node = h(
          Tag,
          {key: slotKey, variant: 'outlined'},
          {
            icon: prefix === '@' ? () => h(UserOutlined) : undefined,
            default: () => value.value,
          },
        )
        if (instance) {
          node.appContext = chipAppContext() ?? null
        }
        return node
      },
    }
  }

  function createInstructionSlot(option: InstructionItem, measure: InstructionMeasure): object {
    return instructionSlot({
      id: crypto.randomUUID(),
      type: 'custom',
      slotKind: 'instruction',
      value: option as unknown as IdValueMetadata<string, string>,
      prefix: String(option.metadata?.slotPrefix ?? measure.prefix),
    })
  }

  return {instructionSlot, createInstructionSlot}
}

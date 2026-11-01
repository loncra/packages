import type {MenuItemType} from 'antdv-next'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {InstructionSenderHandle} from '@loncra/antdv-chat'
import type {VNodeChild} from 'vue'

export interface AgentSenderWorkspace {
  title: string
  color?: string
  variant?: 'outlined' | 'filled' | 'solid'
  icon?: () => VNodeChild
}

export interface AgentSenderChoice {
  label?: string
  color?: string
  icon?: string | null
  items: MenuItemType[]
  selectedKeys: string[]
}

export interface AgentSenderExpose {
  flush: () => Promise<void>
  clearStored: () => Promise<void>
  clear: () => void
  getSlotConfigValue: () => SlotConfigType[]
  getSender: () => InstructionSenderHandle | undefined
}

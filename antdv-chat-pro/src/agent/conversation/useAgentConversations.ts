import {ref, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {findFirstTreeNode, getEnumValue, isEnumValue} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'
import {
  AGENT_WORKSPACE_TYPE_VALUE,
  AgentService,
  AI_SERVER_AGENT_CONVERSATION_TYPE,
  AI_SERVER_EXECUTION_CHANNEL,
} from '@loncra/client/ai'
import type {AgentConversationHost, AgentConversationMenuKey, AgentConversationRecord} from './types'

export function isDefaultWorkspace(type: number): boolean {
  return isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)
}

export function isWorkspaceConversation(type: number): boolean {
  return isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION)
}

function bakeDisplayNames(items: AgentConversationRecord[], host: AgentConversationHost): void {
  for (const item of items) {
    item.name = host.displayName?.(item) ?? item.name
    const type = getEnumValue(item.type)
    if (AGENT_WORKSPACE_TYPE_VALUE.includes(type)) {
      item.tone = host.iconTone?.(item) ?? (isDefaultWorkspace(type) ? 'primary' : 'success')
    }
    const children = (item.children ?? []) as AgentConversationRecord[]
    if (children.length > 0) {
      bakeDisplayNames(children, host)
    }
  }
}

export function isCustomizeWorkspace(type: number): boolean {
  return isEnumValue(type, AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE)
}

export function agentMenuKeys(type: number): AgentConversationMenuKey[] {
  if (isDefaultWorkspace(type)) {
    return ['create']
  }
  if (isWorkspaceConversation(type)) {
    return ['rename', 'delete']
  }
  return ['create', 'rename', 'delete']
}

function findEditing(items: AgentConversationRecord[]): AgentConversationRecord | undefined {
  for (const item of items) {
    if (item.editing) {
      return item
    }
    const child = findEditing((item.children || []) as AgentConversationRecord[])
    if (child) {
      return child
    }
  }
  return undefined
}

export function useAgentConversations<T extends AgentConversationRecord>(
  conversations: Ref<T[]>,
  host: AgentConversationHost,
) {
  const loading = ref(false)
  const {modal, message} = useApp()
  const locale = useLocale('AgentConversation')

  function remove(item: AgentConversationRecord): void {
    if (item.id == null && !host.onRemove) {
      return
    }
    const copy = locale.value
    modal.confirm({
      title: copy.deleteConfirmTitle,
      content: copy.deleteConfirmSingle,
      onOk: async () => doRemove(item)
    })
  }

  async function doRemove(item: AgentConversationRecord) {
    loading.value = true
    try {
      if (await host.onRemove?.(item)) {
        await load()
        notifyWorkspaceRemoved(item)
        return
      }
      if (item.id == null) {
        return
      }
      const result = await AgentService.deleteConversation(
        [String(item.id)],
        item.metadata?.kind === AI_SERVER_EXECUTION_CHANNEL.CLIENT ? AI_SERVER_EXECUTION_CHANNEL.CLIENT : undefined,
      )
      message.success(result.message ?? '')
      await load()
      notifyWorkspaceRemoved(item)
    } catch {
      return
    } finally {
      loading.value = false
    }
  }

  function notifyWorkspaceRemoved(item: AgentConversationRecord): void {
    const type = getEnumValue(item.type)
    if (isDefaultWorkspace(type) || isCustomizeWorkspace(type)) {
      host.onWorkspaceRemoved?.(item)
    }
  }

  async function load(switchItemId?: string): Promise<void> {
    loading.value = true
    try {
      const source = host.conversationsLoader
        ? await host.conversationsLoader()
        : ((await AgentService.findConversations()).data || [])
      conversations.value = source as T[]
      bakeDisplayNames(conversations.value, host)
      host.afterLoad(conversations.value)
      const activate = switchItemId
        ? findFirstTreeNode((item) => item.id === switchItemId, conversations.value) as T | undefined
        : conversations.value.find((item) => isDefaultWorkspace(getEnumValue(item.type)))
      if (activate) {
        host.onOpen(activate)
      }
    } finally {
      loading.value = false
    }
  }

  function startCreate(ownership?: number): void {
    if (findEditing(conversations.value)) {
      return
    }
    conversations.value = [
      {
        key: crypto.randomUUID(),
        name: '',
        editing: true,
        type: AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE,
        ownership,
      } as T,
      ...conversations.value,
    ]
  }

  function cancelEdit(item: AgentConversationRecord): void {
    if (item.id) {
      item.editing = false
      item.name = item.original
      delete item.original
      return
    }
    conversations.value = conversations.value.filter((entry) => entry.key !== item.key)
  }

  function startRename(item: AgentConversationRecord): void {
    const editing = findEditing(conversations.value)
    if (editing && editing !== item) {
      cancelEdit(editing)
    }
    item.original = item.name
    item.editing = true
  }

  async function confirmEdit(item: AgentConversationRecord): Promise<void> {
    if (loading.value) {
      return
    }
    loading.value = true
    try {
      const result = await AgentService.saveConversation(
        item,
        undefined,
        item.ownership == null ? undefined : getEnumValue(item.ownership),
      )
      item.editing = false
      message.success(result.message ?? '')
      await load(result.data)
    } catch {
      return
    } finally {
      loading.value = false
    }
  }

  return {
    conversations,
    loading,
    load,
    startCreate,
    startRename,
    cancelEdit,
    confirmEdit,
    remove,
  }
}

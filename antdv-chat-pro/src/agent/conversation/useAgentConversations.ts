import {onMounted, ref, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import {findFirstTreeNode, isEnumValue} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale.ts'
import {
  AgentService,
  AI_SERVER_AGENT_CHAT_STATUS,
  AI_SERVER_AGENT_CONVERSATION_TYPE,
  type AgentConversationEntity,
} from '@loncra/client/ai'

export interface AgentConversationRecord extends AgentConversationEntity {
  editing?: boolean
  original?: string
}

export interface AgentConversationHost {
  timeText: (unix?: number) => string
  onOpen: (item: AgentConversationRecord) => void
  onOpenPluginMarket: () => void
  afterLoad: (items: AgentConversationRecord[]) => void
}

export type AgentConversationMenuKey = 'create' | 'rename' | 'delete'

export function agentMenuKeys(type: unknown): AgentConversationMenuKey[] {
  if (isEnumValue(type as number, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE)) {
    return ['create']
  }
  if (isEnumValue(type as number, AI_SERVER_AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION)) {
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

  function confirmDelete(): Promise<boolean> {
    const copy = locale.value
    return new Promise((resolve) => {
      modal.confirm({
        title: copy.deleteConfirmTitle,
        content: copy.deleteConfirmSingle,
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }

  async function load(switchItemId?: number): Promise<void> {
    loading.value = true
    try {
      const result = await AgentService.findConversation()
      conversations.value = (result.data || []) as T[]
      host.afterLoad(conversations.value)
      const activate = switchItemId
        ? findFirstTreeNode((item) => item.id === switchItemId, conversations.value) as T | undefined
        : conversations.value.find((item) =>
          isEnumValue(item.type, AI_SERVER_AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE))
      if (activate) {
        host.onOpen(activate)
      }
    } finally {
      loading.value = false
    }
  }

  function startCreate(): void {
    if (findEditing(conversations.value)) {
      return
    }
    conversations.value = [
      {
        key: crypto.randomUUID(),
        name: '',
        editing: true,
        type: AI_SERVER_AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE,
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
      const result = await AgentService.saveConversation(item)
      item.editing = false
      message.success(result.message ?? '')
      await load(result.data)
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  async function remove(item: AgentConversationRecord): Promise<void> {
    const confirmed = await confirmDelete()
    if (!confirmed || item.id == null) {
      return
    }
    loading.value = true
    try {
      const result = await AgentService.deleteConversation([Number(item.id)])
      message.success(result.message ?? '')
      await load()
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void load()
  })

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

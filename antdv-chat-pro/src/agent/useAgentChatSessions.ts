import {computed, ref, type Ref} from 'vue'
import dayjs from 'dayjs'
import {emptyPageResult, filterTreeDeep, findFirstTreeNode, getEnumValue, unmergeTree} from '@loncra/client/commons'
import {AGENT_WORKSPACE_TYPE_VALUE, type AgentConversationEntity} from '@loncra/client/ai'
import type {AgentConversationHost, AgentConversationRecord} from './conversation'
import {useAgentConversations} from './conversation'
import type {AgentSession} from './types'
import {isConversation} from './useAgentChatOptions'
import type {AgentSenderExpose} from './sender/AgentSender'
import type {useAgentHistory} from './history/useAgentHistory'

function nodeKey(item: {key?: string; id?: number}): string {
    return String(item.key ?? item.id ?? '')
}

function ensureSession(item: AgentConversationRecord): AgentSession {
    const session = item as AgentSession
    if (!session.dataSource) {
        session.dataSource = emptyPageResult()
    }
    if (session.loading == null) {
        session.loading = false
    }
    return session
}

type AgentChatHistory = ReturnType<typeof useAgentHistory<AgentSession>>

export function useAgentChatSessions(options: {
    current: Ref<AgentSession | undefined>
    history: AgentChatHistory
    senderRef: Ref<AgentSenderExpose | undefined>
    onActive: (session: AgentSession | undefined) => void
}) {
    const {current, history, senderRef, onActive} = options
    const conversations = ref<AgentConversationRecord[]>([])
    const selectedKeys = ref<string[]>([])
    const openKeys = ref<string[]>([])
    const pane = ref<'chat' | 'hub'>('chat')

    function updateMenu(item: AgentConversationRecord): void {
        const treeNode = filterTreeDeep((entry) => entry.id === item.parentId, conversations.value)
        const opened = unmergeTree(treeNode)
            .filter((entry) => entry.id !== item.id)
            .map((entry) => nodeKey(entry))
        openKeys.value = [...openKeys.value, ...opened]
        const children = item.children
        if (children && children.length > 0) {
            openKeys.value = [...openKeys.value, nodeKey(item)]
            selectedKeys.value = []
            return
        }
        selectedKeys.value = [nodeKey(item)]
    }

    function sameSession(item: AgentConversationRecord): boolean {
        const session = current.value
        if (!session) {
            return false
        }
        return session === item || (session.id != null && session.id === item.id)
    }

    async function openItem(item: AgentConversationRecord): Promise<void> {
        await senderRef.value?.flush()
        pane.value = 'chat'
        if (sameSession(item)) {
            return
        }
        const session = ensureSession(item)
        updateMenu(session)
        current.value = session
        if (!isConversation(session)) {
            return
        }
        await history.switchConversation(current, undefined, true)
        onActive(current.value)
    }

    const host: AgentConversationHost = {
        timeText: (unix) => (unix == null ? '' : dayjs(unix).fromNow()),
        onOpen: (item) => {
            void openItem(item)
        },
        onOpenPluginMarket: () => {
            pane.value = 'hub'
        },
        afterLoad: () => {},
    }
    const conversationApi = useAgentConversations(conversations, host)

    const workspaces = computed(() =>
        conversations.value.filter(
            (item) => item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type)),
        ),
    )

    function currentWorkspaceId(): number | undefined {
        const session = current.value
        if (!session) {
            return undefined
        }
        if (isConversation(session)) {
            return session.parentId
        }
        return session.id
    }

    function placeConversation(body: AgentConversationEntity): AgentSession {
        const found = findFirstTreeNode(
            (item) => Number(item.id) === Number(body.id),
            conversations.value,
        )
        if (found) {
            const session = ensureSession(found)
            session.name = body.name
            session.status = body.status
            session.lastModel = body.lastModel
            session.lastChatType = body.lastChatType
            return session
        }
        const node = ensureSession(body as AgentConversationRecord)
        const parent = conversations.value.find((item) => item.id === node.parentId)
        if (parent) {
            parent.children = [node, ...((parent.children || []) as AgentConversationRecord[])]
        }
        return node
    }

    return {
        conversations,
        selectedKeys,
        openKeys,
        pane,
        current,
        conversationApi,
        workspaces,
        host,
        currentWorkspaceId,
        placeConversation,
        updateMenu,
    }
}

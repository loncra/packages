import {computed, nextTick, type Ref} from 'vue'
import useApp from 'antdv-next/dist/app/useApp'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import {appendMessages} from '@loncra/chat-core'
import {getEnumValue} from '@loncra/client/commons'
import {
    type AgentChatResponseBody,
    type AgentConversationEntity,
    type AgentMessageEntity,
    AgentService,
    AI_SERVER_AGENT_CHAT_STATUS,
    CHAT_BUBBLE_TYPE,
    STREAM_RUNNING_STATUS_VALUE,
} from '@loncra/client/ai'
import type {AgentConversationRecord} from './conversation'
import type {AgentSession} from './types'
import {isWorkspaceConversation} from './conversation/useAgentConversations'
import type {AgentSenderExpose} from './sender/AgentSender'
import type {BubbleListExpose} from '../bubble-list/types'
import type {useAgentHistory} from './history/useAgentHistory'

function running(session: AgentSession | undefined): boolean {
    if (!session) {
        return false
    }
    return session.dataSource.elements.some((item) => {
        if (item.role !== CHAT_BUBBLE_TYPE.AI) {
            return false
        }
        const status = (item as {status?: unknown}).status
        if (status == null) {
            return false
        }
        return STREAM_RUNNING_STATUS_VALUE.includes(getEnumValue(status as number))
    })
}

function buildChatMessages(
    data: AgentChatResponseBody,
    blocks: unknown[],
    conversationId: number,
): {user: AgentMessageEntity; assistant: AgentMessageEntity} {
    const userMessage: AgentMessageEntity = {
        model: data.conversation.lastModel!,
        type: data.conversation.lastChatType!,
        id: data.userMessageId,
        content: blocks,
        status: AI_SERVER_AGENT_CHAT_STATUS.READY,
        role: CHAT_BUBBLE_TYPE.USER,
        agentConversationId: conversationId,
    }
    const assistantMessage: AgentMessageEntity = {
        id: data.assistantMessageId,
        content: [],
        model: data.conversation.lastModel!,
        type: data.conversation.lastChatType!,
        status: AI_SERVER_AGENT_CHAT_STATUS.READY,
        role: CHAT_BUBBLE_TYPE.AI,
        agentConversationId: conversationId,
        parentId: data.userMessageId,
    }
    return {user: userMessage, assistant: assistantMessage}
}

type AgentChatHistory = ReturnType<typeof useAgentHistory<AgentSession>>

export function useAgentChatSend(options: {
    current: Ref<AgentSession | undefined>
    pane: Ref<'chat' | 'hub'>
    history: AgentChatHistory
    senderRef: Ref<AgentSenderExpose | undefined>
    bubbleListRef: Ref<BubbleListExpose | undefined>
    form: {modelId: number | undefined; type: number}
    placeConversation: (body: AgentConversationEntity) => AgentSession
    updateMenu: (item: AgentConversationRecord) => void
    onActive: (session: AgentSession | undefined) => void
}) {
    const {current, pane, history, senderRef, bubbleListRef, form, onActive} = options
    const {message} = useApp()

    const isRunning = computed(() => {
        const session = current.value
        if (!session) {
            return false
        }
        return session.loading || running(session)
    })

    function blocksOf(slotConfig: SlotConfigType[]): unknown[] {
        const blocks: unknown[] = []
        for (const slot of slotConfig) {
            if (slot.type === 'custom' && slot.props?.slotKind === 'instruction' && slot.key) {
                const value = slot.props.defaultValue as {id?: string; value?: string} | undefined
                blocks.push({
                    id: slot.key,
                    value: {id: value?.id, value: value?.value},
                    type: 'custom',
                    prefix: slot.props.prefix,
                    slotKind: 'instruction',
                })
                continue
            }
            blocks.push(slot)
        }
        return blocks
    }

    async function openReturned(body: AgentChatResponseBody): Promise<void> {
        const node = options.placeConversation(body.conversation)
        options.updateMenu(node)
        pane.value = 'chat'
        current.value = node
        if (isWorkspaceConversation(getEnumValue(node.type))) {
            await history.switchConversation(current, undefined, true)
        }
        onActive(current.value)
    }

    async function applyChatResult(data: AgentChatResponseBody, session: AgentSession, blocks: unknown[]): Promise<void> {
        senderRef.value?.clear()
        await senderRef.value?.clearStored()
        if (data.conversation.id !== session.id) {
            await openReturned(data)
            return
        }
        const conversationId = Number(session.id)
        const {user: userMessage, assistant: assistantMessage} = buildChatMessages(data, blocks, conversationId)
        appendMessages(userMessage, CHAT_BUBBLE_TYPE.USER, session.dataSource.elements, true)
        appendMessages(assistantMessage, CHAT_BUBBLE_TYPE.AI, session.dataSource.elements, true)
        await nextTick()
        bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
        onActive(session)
    }

    async function onSubmit(_value: string, slotConfig?: SlotConfigType[]): Promise<void> {
        const session = current.value
        if (!session || !slotConfig?.length) {
            return
        }
        session.loading = true
        try {
            const result = await AgentService.chat({
                modelId: form.modelId,
                type: form.type,
                content: blocksOf(slotConfig),
                agentConversationId: session.id,
            })
            if (!result.data?.conversation) {
                return
            }
            await applyChatResult(result.data, session, blocksOf(slotConfig))
        } catch (error) {
            message.error(error instanceof Error ? error.message : String(error))
        } finally {
            session.loading = false
        }
    }

    return {
        isRunning,
        onSubmit,
    }
}

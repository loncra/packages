import {computed, onMounted, ref} from 'vue'
import dayjs from 'dayjs'
import type {InstructionItem} from '@loncra/antdv-chat'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ChatRole} from '@loncra/chat-core'
import {getEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import {
    AgentService,
    type AgentStreamTransport,
    CHAT_BUBBLE_TYPE,
    type UserPluginInstallResult
} from '@loncra/client/ai'
import {useLocale} from '../_util/useLocale'
import {createAgentDraftBinding} from './draft/createAgentDraftBinding'
import {useAgentHistory} from './history/useAgentHistory'
import {toCatalogItems, useAgentInstructionSlots} from './sender/useAgentInstructionSlots'
import {useAgentChatOptions} from './useAgentChatOptions'
import {useAgentChatSessions} from './useAgentChatSessions'
import {useAgentChatSend} from './useAgentChatSend'
import {getConversationRuns, useAgentStream} from './stream/useAgentStream'
import type {AgentSession, Self} from './types'
import type {AgentSenderExpose} from './sender/AgentSender'
import type {BubbleListExpose} from '../bubble-list/types'

function filterInstruction(keyword: string, dataSource: InstructionItem[]): InstructionItem[] {
    const query = keyword.trim().toLowerCase()
    if (!query) {
        return dataSource
    }
    return dataSource.filter((item) => item.value.toLowerCase().includes(query))
}

export function useAgentChat(
    props: {
        installs: UserPluginInstallResult[]
        self: Self
        buildHeaders?: () => Record<string, string>
        transport?: AgentStreamTransport
    },
) {
    const chatLocale = useLocale('AgentChat')
    const hubLocale = useLocale('AgentHub')
    const senderRef = ref<AgentSenderExpose>()
    const bubbleListRef = ref<BubbleListExpose>()
    const current = ref<AgentSession>()

    const history = useAgentHistory(current, {
        noMoreText: () => chatLocale.value.noMore,
        nowUnix: () => dayjs().unix(),
        resolveRole: (row): ChatRole => {
            const role = getEnumValue(row.role)
            if (role === CHAT_BUBBLE_TYPE.AI) {
                return CHAT_BUBBLE_TYPE.AI
            }
            if (role === CHAT_BUBBLE_TYPE.SYSTEM) {
                return CHAT_BUBBLE_TYPE.SYSTEM
            }
            return CHAT_BUBBLE_TYPE.USER
        },
        scrollToBottom: () => {
            bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
        },
        jumpToMessage: (key) => {
            bubbleListRef.value?.jumpToMessage(key)
        },
    })

    const stream = useAgentStream({
        current: () => sessions.current.value,
        transport: props.transport,
        buildHeaders: () => props.buildHeaders?.() ?? {},
    })

    function onSessionActive(session: AgentSession | undefined) {
        stream.disconnectIfRunning()
        if (!session) {
            return
        }
        for (const run of getConversationRuns(session)) {
            stream.connect(Number(run.id), false)
        }
    }

    const sessions = useAgentChatSessions({
        current,
        history,
        senderRef,
        onActive: onSessionActive,
    })

    const catalogItems = computed<InstructionItem[]>(() =>
        toCatalogItems(
            props.installs,
            sessions.currentWorkspaceId(),
            {mcp: hubLocale.value.mcp, skill: hubLocale.value.skill},
        ),
    )

    const instruction = useAgentInstructionSlots({
        senderRef,
        catalogItems,
    })

    const binding = createAgentDraftBinding({
        principal: () => props.self.systemName || undefined,
        targetId: () => (current.value?.id == null ? undefined : String(current.value.id)),
        factories: {restoreInstructionSlot: instruction.instructionSlot},
    })

    const options = useAgentChatOptions({
        current,
        conversations: sessions.conversations,
        workspaceLabel: () => chatLocale.value.workspace,
    })

    const send = useAgentChatSend({
        current,
        pane: sessions.pane,
        history,
        senderRef,
        bubbleListRef,
        form: options.form,
        placeConversation: sessions.placeConversation,
        updateMenu: sessions.updateMenu,
        onActive: onSessionActive,
    })

    async function onCancelSession(session: AgentSession) {
        for (const run of getConversationRuns(session)) {
            await AgentService.interrupt(Number(run.key))
        }
        stream.disconnectIfRunning()
    }

    function readLive(): SlotConfigType[] {
        return senderRef.value?.getSlotConfigValue() ?? []
    }

    onMounted(() => {
        void sessions.conversationApi.load()
        void options.loadOptions()
    })

    return {
        selfName: computed(() => AuthServerService.getPrincipalNameByUserDetails(props.self) || '-'),
        filterInstruction,
        senderRef,
        bubbleListRef,
        conversations: sessions.conversations,
        selectedKeys: sessions.selectedKeys,
        openKeys: sessions.openKeys,
        pane: sessions.pane,
        current: sessions.current,
        conversationApi: sessions.conversationApi,
        workspaces: sessions.workspaces,
        host: sessions.host,
        catalogItems,
        instruction,
        binding,
        readLive,
        options,
        isRunning: send.isRunning,
        onSubmit: send.onSubmit,
        onCancelSession,
        stream,
    }
}

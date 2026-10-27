import {computed, onMounted, ref} from 'vue'
import dayjs from 'dayjs'
import type {InstructionItem} from '@loncra/antdv-chat'
import type {SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {ChatRole} from '@loncra/chat-core'
import {getEnumValue} from '@loncra/client/commons'
import {AuthServerService} from '@loncra/client/auth'
import {CHAT_BUBBLE_TYPE, type UserPluginInstallResult} from '@loncra/client/ai'
import {useLocale} from '../_util/useLocale'
import {createAgentDraftBinding} from './draft/createAgentDraftBinding'
import {useAgentHistory} from './history/useAgentHistory'
import {toCatalogItems, useAgentInstructionSlots} from './sender/useAgentInstructionSlots'
import {isConversation, useAgentChatOptions} from './useAgentChatOptions'
import {useAgentChatSessions} from './useAgentChatSessions'
import {useAgentChatSend} from './useAgentChatSend'
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
    props: {installs: UserPluginInstallResult[]; self: Self},
    emit: (event: 'active', session: AgentSession | undefined) => void,
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
        isWorkspace: isConversation,
        scrollToBottom: () => {
            bubbleListRef.value?.scrollTo({top: 'bottom', behavior: 'smooth'})
        },
        jumpToMessage: (key) => {
            bubbleListRef.value?.jumpToMessage(key)
        },
    })

    const sessions = useAgentChatSessions({
        current,
        history,
        senderRef,
        onActive: (session) => emit('active', session),
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
        onActive: (session) => emit('active', session),
    })

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
    }
}

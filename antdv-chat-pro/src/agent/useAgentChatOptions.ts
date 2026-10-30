import {computed, h, reactive, ref, type Ref, watch} from 'vue'
import type {MenuItemType} from 'antdv-next'
import {
    FolderOpenOutlined,
    FolderOutlined,
    ProfileOutlined,
    QuestionCircleOutlined,
    RobotOutlined,
} from '@antdv-next/icons'
import {
    getEnumValue,
    type IdValueMetadata,
    isEnumValue,
    ResourceServerService,
    SYSTEM_ENUM_TYPE,
    SYSTEM_MODULE_NAME
} from '@loncra/client/commons'
import {
    AI_SERVER_AGENT_CHAT_TYPE,
    AI_SERVER_MODEL_TYPE,
    type ModelSettingEntity,
    ModelSettingService
} from '@loncra/client/ai'
import {toModelMenuItems} from './sender/agentMenus'
import type {AgentSenderChoice, AgentSenderWorkspace} from './sender/AgentSender'
import {isDefaultWorkspace, isWorkspaceConversation} from './conversation/useAgentConversations'
import type {AgentConversationRecord} from './conversation'
import type {AgentSession} from './types'

function typeIcon(type: number) {
    if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.ASK)) {
        return QuestionCircleOutlined
    }
    if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.PLAN)) {
        return ProfileOutlined
    }
    return RobotOutlined
}

function typeColor(type: number): string {
    if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.ASK)) {
        return 'cyan'
    }
    if (isEnumValue(type, AI_SERVER_AGENT_CHAT_TYPE.PLAN)) {
        return 'pink'
    }
    return 'purple'
}

export function useAgentChatOptions(options: {
    current: Ref<AgentSession | undefined>
    conversations: Ref<AgentConversationRecord[]>
    workspaceLabel: () => string
}) {
    const models = ref<ModelSettingEntity[]>([])
    const types = ref<IdValueMetadata<number, string>[]>([])
    const modelOptions = ref<MenuItemType[]>([])
    const typeOptions = ref<MenuItemType[]>([])
    const form = reactive({
        type: AI_SERVER_AGENT_CHAT_TYPE.AGENT as number,
        modelId: undefined as number | undefined,
    })

    async function loadOptions(): Promise<void> {
        const modelSettingService = new ModelSettingService()
        const enumerate = await ResourceServerService.getServiceEnumerate<number, string>(
            SYSTEM_MODULE_NAME.AI_SERVER,
            SYSTEM_ENUM_TYPE.AGENT_CHAT_TYPE_ENUM,
        )
        types.value = enumerate.data || []
        typeOptions.value = types.value.map((item) => ({
            key: String(item.id),
            label: item.value,
            icon: () => h(typeIcon(Number(item.id))),
        }))
        const model = await modelSettingService.findEnabled({
            'filter_[type_eq]': AI_SERVER_MODEL_TYPE.CHAT,
        })
        models.value = model.data || []
        modelOptions.value = toModelMenuItems(models.value)
        const first = models.value[0]
        if (form.modelId == null && first?.id != null) {
            form.modelId = first.id
        }
    }

    const currentModel = computed(() => models.value.find((item) => item.id === form.modelId))

    const workspaceView = computed<AgentSenderWorkspace | undefined>(() => {
        const session = options.current.value
        if (!session) {
            return undefined
        }
        const workspace = isWorkspaceConversation(getEnumValue(session.type))
            ? options.conversations.value.find((item) => item.id === session.parentId)
            : session
        if (!workspace?.name) {
            return undefined
        }
        const isDefault = isDefaultWorkspace(getEnumValue(workspace.type))
        return {
            title: `${options.workspaceLabel()}: ${workspace.name}`,
            color: isDefault ? 'blue' : 'green',
            variant: 'outlined',
            icon: () => h(isDefault ? FolderOpenOutlined : FolderOutlined),
        }
    })

    const modelView = computed<AgentSenderChoice | undefined>(() => {
        const model = currentModel.value
        if (!model) {
            return undefined
        }
        return {
            label: `${model.manufacturer.name}:${model.name}`,
            icon: model.icon,
            items: modelOptions.value,
            selectedKeys: [String(model.id)],
        }
    })

    const typeView = computed<AgentSenderChoice>(() => {
        const matched = types.value.find((item) => item.id === form.type)
        return {
            label: matched?.value,
            color: typeColor(form.type),
            items: typeOptions.value,
            selectedKeys: [String(matched?.id ?? form.type)],
        }
    })

    function applyConversationModel(session: AgentSession | undefined): void {
        if (!session) {
            form.modelId = undefined
            form.type = AI_SERVER_AGENT_CHAT_TYPE.AGENT
            return
        }
        if (session.lastModel?.id != null) {
            form.modelId = session.lastModel.id
        }
        if (session.lastChatType != null) {
            form.type = getEnumValue(session.lastChatType)
        }
    }

    watch(options.current, (session) => applyConversationModel(session))

    return {
        form,
        models,
        types,
        modelOptions,
        typeOptions,
        loadOptions,
        currentModel,
        workspaceView,
        modelView,
        typeView,
    }
}

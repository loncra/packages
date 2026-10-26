import {computed, defineComponent, onMounted, type PropType, ref} from 'vue'
import {Flex, Skeleton, Spin, Tabs} from 'antdv-next'
import {createFromIconfontCN} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    ResourceServerService,
    type TotalPage,
    VALUE_TYPE,
    type DataDictionaryMetadata,
} from '@loncra/client/commons'
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiMcpPackageService,
    MCP_GROUP_CODE_PREFIX,
    type McpPackageEntity,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import type {PageRequest} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation'
import PluginCard from './PluginCard'
import {AGENT_HUB_PREFIX} from './style'

const IconFont = createFromIconfontCN()
const ALL_GROUP_CODE = 'system.all'

function emptyPage(): TotalPage<McpPackageEntity> {
    return {
        elements: [],
        first: true,
        last: true,
        number: 1,
        size: 10,
        totalCount: 0,
        totalPages: 0,
        metadata: {},
    }
}

function withAll(items: DataDictionaryMetadata[], allName: string): DataDictionaryMetadata[] {
    return [
        {code: ALL_GROUP_CODE, name: allName, value: '*', valueType: VALUE_TYPE.STRING},
        ...items,
    ]
}

const McpMarket = defineComponent({
    name: 'LAgentHubMcp',
    props: {
        installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
        workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    },
    emits: ['installed', 'uninstalled'],
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const config = useConfig()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const service = new AiMcpPackageService()
        const loading = ref(false)
        const install = ref(false)
        const dataSource = ref<TotalPage<McpPackageEntity>>(emptyPage())
        const groups = ref<DataDictionaryMetadata[]>([])
        const activeGroupCode = ref<string>()

        function onTabChange(key: string): void {
            activeGroupCode.value = key
            void loadData({number: 1, size: 10})
        }

        async function loadData(request: PageRequest): Promise<void> {
            loading.value = true
            try {
                if (activeGroupCode.value !== ALL_GROUP_CODE) {
                    request['filter_[category.code_jeq]'] = activeGroupCode.value
                }
                const result = await service.pageEnabled(request)
                if (result.data) {
                    dataSource.value = result.data
                }
            } finally {
                loading.value = false
            }
        }

        onMounted(async () => {
            install.value = true
            try {
                const result = await ResourceServerService.findDataDictionariesByCodes([MCP_GROUP_CODE_PREFIX])
                if (!result.data) {
                    return
                }
                groups.value = withAll(result.data[MCP_GROUP_CODE_PREFIX] || [], locale.value.all)
                const first = groups.value[0]
                if (first) {
                    onTabChange(first.code)
                }
            } finally {
                install.value = false
            }
        })

        return () => (
            <Skeleton active loading={install.value}>
                <Tabs
                    class={`${prefixCls.value}-tabs`}
                    tabPlacement="start"
                    classes={{
                        body: `${prefixCls.value}-tabs-body`,
                        content: `${prefixCls.value}-tabs-content`,
                    }}
                    items={groups.value.map((group) => ({
                        label: group.name,
                        key: group.code,
                        metadata: group.metadata,
                    }))}
                    onChange={(key) => onTabChange(String(key))}
                    v-slots={{
                        labelRender: ({item}: { item: { label?: string; metadata?: { icon?: string } } }) => (
                            <Flex gap="small">
                                {item.metadata?.icon
                                    ? <IconFont type={item.metadata.icon}/>
                                    : <IconFont type="loncra-plug-zap"/>}
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => (
                            <Spin spinning={loading.value} class={`${prefixCls.value}-full-spin`}>
                                <PluginCard
                                    dataSource={dataSource.value}
                                    installs={props.installs}
                                    workspaces={props.workspaces}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.MCP}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(id: number) => emit('uninstalled', id)}
                                    v-slots={{
                                        title: ({record}: { record: McpPackageEntity }) => record.name,
                                    }}
                                />
                            </Spin>
                        ),
                    }}
                />
            </Skeleton>
        )
    },
})

export default McpMarket

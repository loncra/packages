import {computed, defineComponent, onMounted, type PropType, ref} from 'vue'
import {Badge, Collapse, Flex, Skeleton, Spin, Tabs} from 'antdv-next'
import {createFromIconfontCN} from '@antdv-next/icons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {
    type DataDictionaryMetadata,
    type PageRequest,
    ResourceServerService,
    type TotalPage,
    VALUE_TYPE,
} from '@loncra/client/commons'
import {
    AI_SERVER_PLUGIN_TARGET_TYPE,
    AiSkillPackageService,
    AiUserPluginInstallService,
    SKILL_GROUP_CODE_PREFIX,
    type SkillPackageEntity,
    type UserPluginInstallResult,
} from '@loncra/client/ai'
import {useLocale} from '../../_util/useLocale'
import type {AgentConversationRecord} from '../conversation/useAgentConversations'
import PluginCard from './PluginCard'
import SkillReleaseChangeLog from './SkillReleaseChangeLog'
import {AGENT_HUB_PREFIX} from './style'

const IconFont = createFromIconfontCN()
const ALL_GROUP_CODE = 'system.all'

function emptyPage(): TotalPage<SkillPackageEntity> {
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

const SkillMarket = defineComponent({
    name: 'LAgentHubSkill',
    props: {
        installs: {type: Array as PropType<UserPluginInstallResult[]>, default: () => []},
        workspaces: {type: Array as PropType<AgentConversationRecord[]>, default: () => []},
    },
    emits: ['installed', 'uninstalled'],
    setup(props, {emit}) {
        const locale = useLocale('AgentHub')
        const config = useConfig()
        const prefixCls = computed(() => config.value.getPrefixCls('agent-hub', AGENT_HUB_PREFIX))
        const service = new AiSkillPackageService()
        const loading = ref(false)
        const install = ref(false)
        const dataSource = ref<TotalPage<SkillPackageEntity>>(emptyPage())
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
                const result = await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
                if (!result.data) {
                    return
                }
                groups.value = withAll(result.data[SKILL_GROUP_CODE_PREFIX] || [], locale.value.all)
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
                                <IconFont type={item.metadata?.icon || 'loncra-sparkles'}/>
                                <span>{item.label}</span>
                            </Flex>
                        ),
                        contentRender: () => (
                            <Spin spinning={loading.value} class={`${prefixCls.value}-spin`}>
                                <PluginCard
                                    dataSource={dataSource.value}
                                    installs={props.installs}
                                    workspaces={props.workspaces}
                                    targetType={AI_SERVER_PLUGIN_TARGET_TYPE.SKILL}
                                    onChangePage={(page: number, pageSize: number) => {
                                        void loadData({number: page, size: pageSize})
                                    }}
                                    onInstalled={(result: UserPluginInstallResult) => emit('installed', result)}
                                    onUninstalled={(id: number) => emit('uninstalled', id)}
                                    v-slots={{
                                        title: ({record}: { record: SkillPackageEntity }) => (
                                            <Badge
                                                dot={AiUserPluginInstallService.isSkillOutdated(props.installs, record)}>
                                                {record.name} {record.latestVersion}
                                            </Badge>
                                        ),
                                        after: ({record}: { record: SkillPackageEntity }) => (
                                            <Collapse
                                                ghost
                                                class={`${prefixCls.value}-changelog`}
                                                items={[{key: 'changelog', label: locale.value.changelog}]}
                                                v-slots={{
                                                    contentRender: () => record.id == null
                                                        ? null
                                                        : <SkillReleaseChangeLog packageId={record.id}/>,
                                                }}
                                            />
                                        ),
                                    }}
                                />
                            </Spin>
                        ),
                    }}
                />
            </Skeleton>
        )
    }
})

export default SkillMarket

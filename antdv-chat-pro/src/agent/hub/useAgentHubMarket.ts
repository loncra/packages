import {onMounted, ref} from 'vue'
import {
    ResourceServerService,
    type DataDictionaryMetadata,
    type PageRequest,
    type RestResult,
    type TotalPage,
    VALUE_TYPE,
} from '@loncra/client/commons'
import {useLocale} from '../../_util/useLocale'

const ALL_GROUP_CODE = 'system.all'

function emptyPage<T>(): TotalPage<T> {
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

interface PageEnabledService<T> {
    pageEnabled: (request: PageRequest) => Promise<RestResult<TotalPage<T>>>
}

export function useAgentHubMarket<T>(service: PageEnabledService<T>, groupCodePrefix: string) {
    const locale = useLocale('AgentHub')
    const loading = ref(false)
    const install = ref(false)
    const dataSource = ref<TotalPage<T>>(emptyPage())
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
            const result = await ResourceServerService.findDataDictionariesByCodes([groupCodePrefix])
            if (!result.data) {
                return
            }
            groups.value = withAll(result.data[groupCodePrefix] || [], locale.value.all)
            const first = groups.value[0]
            if (first) {
                onTabChange(first.code)
            }
        } finally {
            install.value = false
        }
    })

    return {
        loading,
        install,
        dataSource,
        groups,
        activeGroupCode,
        onTabChange,
        loadData,
    }
}

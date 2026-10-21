import {computed, type Ref, type SetupContext, type SlotsType, toRef} from 'vue'
import type {TableProps} from 'antdv-next'
import {App} from 'antdv-next'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useTwoWayModel} from '@loncra/antdv'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useLocale} from '../_util/useLocale'
import {useActionAuth, useCrudConfig} from '../crud-config-provider'
import {useActionResolver} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {type DefaultCrudEntity, fetchCollectionData, patchQuery} from '../_util/crud/useCollectionData'
import {useCrudDelete} from '../_util/crud/useCrudDelete'
import {fetchDataDictionaries, fetchEnumBuckets} from './dictionaries'
import useStyle from './style'
import type {BasicCrudQueryEmits, BasicCrudQueryProps, BasicCrudQuerySlots, PageDictionaries,} from './types'

export function useBasicCrudQuery(
  props: BasicCrudQueryProps,
  {
    emit,
  }: Pick<
    SetupContext<BasicCrudQueryEmits<DefaultCrudEntity, string | number>, SlotsType<BasicCrudQuerySlots>>,
    'emit'
  >,
) {
  const {message, modal} = App.useApp()
  const locale = useLocale('Crud')
  const config = useConfig()
  const crudConfig = useCrudConfig()
  const auth = useActionAuth(toRef(props, 'hasPermission'))
  const resolver = useActionResolver()

  const prefixCls = computed(() =>
    config.value.getPrefixCls('basic-crud-query', props.prefixCls ?? 'loncra-basic-crud-query'),
  )
  const [hashId, cssVarCls] = useStyle(prefixCls)

  const dataSource = useTwoWayModel(props, 'dataSource', emit) as unknown as Ref<DefaultCrudEntity[]>
  const loading = useTwoWayModel(props, 'loading', emit) as unknown as Ref<boolean>
  const query = useTwoWayModel(props, 'query', emit) as unknown as Ref<FilterRequest | PageRequest>
  const pagination = useTwoWayModel(props, 'pagination', emit) as unknown as Ref<TableProps['pagination']>
  const selected = toRef(props, props.selectedKey ?? 'selectedRows') as unknown as Ref<DefaultCrudEntity[]>
  const buckets = useTwoWayModel(props, 'buckets', emit) as unknown as Ref<EnumBucketsResponseBody>
  const dictionaries = useTwoWayModel(props, 'dictionaries', emit) as unknown as Ref<PageDictionaries>

  async function fetchDataSource(nextQuery?: FilterRequest | PageRequest) {
    loading.value = true
    try {
      dataSource.value = await fetchCollectionData({
        service: props.service,
        query: nextQuery ?? query.value,
        pagination: pagination,
        fetch: props.fetch,
      })
    } finally {
      loading.value = false
    }
  }

  async function onPageChange(page: number, pageSize: number) {
    void fetchDataSource(patchQuery(query, {number: page, size: pageSize}))
  }

  async function loadDictionaries() {
    const [nextBuckets, nextDictionaries] = await Promise.all([
      fetchEnumBuckets(props.enums),
      fetchDataDictionaries(props.dictionaryCodes),
    ])
    buckets.value = nextBuckets
    dictionaries.value = nextDictionaries
  }

  async function onPlanMounted() {
    await loadDictionaries()
    if (props.immediate) {
      await fetchDataSource()
    }
  }

  function onPlanActivated() {
    if (props.refreshOnActivate === false) {
      return
    }
    if (typeof props.refreshOnActivate === 'function') {
      return props.refreshOnActivate()
    }
    return fetchDataSource()
  }

  const {remove} = useCrudDelete<DefaultCrudEntity, DefaultCrudEntity, string | number>({
    service: props.service,
    locale: () => locale.value,
    modal,
    message,
    loading,
    onDeleted: (records) => emit('deleted', records),
    refresh: () => fetchDataSource(),
  })

  const collection: CollectionExpose<DefaultCrudEntity> = {fetchDataSource, remove}

  return {
    message,
    modal,
    locale,
    crudConfig,
    auth,
    resolver,
    prefixCls,
    hashId,
    cssVarCls,
    dataSource,
    loading,
    query,
    pagination,
    selected,
    collection,
    fetchDataSource,
    onPageChange,
    onPlanMounted,
    onPlanActivated,
  }
}

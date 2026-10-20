import {computed, type Ref, type SetupContext, type SlotsType, toRef, useModel} from 'vue'
import {App} from 'antdv-next'
import type {TableProps} from 'antdv-next'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useLocale} from '../_util/useLocale'
import {useActionAuth, useCrudConfig} from '../crud-config-provider'
import {useActionResolver} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {type DefaultCrudEntity, fetchCollectionData, patchQuery} from '../_util/crud/useCollectionData'
import {useCrudDelete} from '../_util/crud/useCrudDelete'
import {fetchDataDictionaries, fetchEnumBuckets} from './dictionaries'
import useStyle from './style'
import type {
  BasicCrudQueryEmits,
  BasicCrudQueryProps,
  BasicCrudQuerySlots,
  PageDictionaries,
} from './types'

type TEntity = DefaultCrudEntity
type TBody = DefaultCrudEntity
type TId = string | number

export function useBasicCrudQuery(
  props: BasicCrudQueryProps,
  {
    emit,
  }: Pick<
    SetupContext<BasicCrudQueryEmits<TEntity, TId>, SlotsType<BasicCrudQuerySlots>>,
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

  const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
  const loading = useModel(props, 'loading') as unknown as Ref<boolean>
  const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
  const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
  const selected = useModel(props, props.selectedKey ?? 'selectedRows') as unknown as Ref<TEntity[]>
  const buckets = useModel(props, 'buckets') as unknown as Ref<EnumBucketsResponseBody>
  const dictionaries = useModel(props, 'dictionaries') as unknown as Ref<PageDictionaries>

  async function fetchDataSource() {
    loading.value = true
    try {
      dataSource.value = await fetchCollectionData({
        service: props.service as never,
        query: query.value,
        pagination: pagination as never,
        fetch: props.fetch as never,
      })
      emit('update:pagination', pagination.value)
    } finally {
      loading.value = false
    }
  }

  function onPageChange(page: number, pageSize: number) {
    patchQuery(query, {number: page, size: pageSize})
    void fetchDataSource()
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

  const {remove} = useCrudDelete<TBody, TEntity, TId>({
    service: props.service,
    locale: () => locale.value,
    modal,
    message,
    loading,
    onDeleted: (records) => emit('deleted', records),
    refresh: () => fetchDataSource(),
  })

  const collection: CollectionExpose<TEntity> = {fetchDataSource, remove}

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

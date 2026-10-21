import {computed, defineComponent, type PropType, ref, type Ref, type SlotsType} from 'vue'
import {App, Descriptions, Divider, Space} from 'antdv-next'
import {HistoryOutlined} from '@antdv-next/icons'
import {isBusinessSuccess, type RestResult} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useAntdvConfig} from '../../config-provider/useAntdvConfig'
import {useCrudConfig} from '../../crud-config-provider'
import DataLoadingCard from '../../data-loading-card'
import {isOperationTraceVisible, OperationTraceTable} from '../operation-trace'
import {useStaleCheck} from '../../_util/crud/useStaleCheck'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {PageDictionaries} from '../../basic-crud-query/types'
import {fetchDataDictionaries, fetchEnumBuckets} from '../../basic-crud-query'
import {useLocale} from '../../_util/useLocale'
import {usePageRegistry} from '../usePageRegistry'
import {buildDetailItems} from './detailItemsKinds'
import type {CrudStaleInfo, PageDeclContext} from '../types'
import type {CrudDetailPageConstructor, CrudDetailPageExpose, CrudDetailPageProps, CrudDetailPageSlots,} from './types'

const DEFAULT_COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

const CrudDetailPage = defineComponent({
  name: 'LCrudDetailPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudDetailPageProps['page']>, required: true},
    id: {type: [String, Number] as PropType<CrudDetailPageProps['id']>, default: undefined},
    contextExtra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    variant: String,
  },
  slots: Object as SlotsType<CrudDetailPageSlots<DefaultCrudEntity>>,
  emits: {
    stale: (_info: CrudStaleInfo) => true,
  },
  setup(props, {attrs, emit, expose, slots}) {
    const config = useCrudConfig()
    const antdv = useAntdvConfig()
    const locale = useLocale('Crud')
    const {message} = App.useApp()
    const registry = usePageRegistry()
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    const sources = computed(() => ({
      enums: props.page.detail.enums ?? [],
      dictionaryCodes: props.page.detail.dictionaryCodes ?? [],
    }))

    async function loadSources(): Promise<void> {
      const [nextBuckets, nextDictionaries] = await Promise.all([
        fetchEnumBuckets(sources.value.enums),
        fetchDataDictionaries(sources.value.dictionaryCodes),
      ])
      buckets.value = nextBuckets
      dictionaries.value = nextDictionaries
    }

    const entity = ref((props.page.detail.createEntity?.() ?? {}) as DefaultCrudEntity) as Ref<DefaultCrudEntity>
    const stale = useStaleCheck({
      pageMode: props.page.staleCheck,
      defaultMode: 'overwrite',
      entity,
      fetchRemote,
    })

    const ctx = computed<PageDeclContext>(() => ({
      variant: props.variant,
      extra: props.contextExtra,
    }))

    const t = (key: string, named?: Record<string, unknown>) =>
      props.page.i18nResolver?.(key, named) ?? config.value.i18nResolver?.(key, named) ?? key

    const items = computed(() =>
      buildDetailItems({
        declared: props.page.detail.fields,
        fields: props.page.fields ?? {},
        entity: entity.value,
        t,
        i18nPrefix: props.page.i18nPrefix,
        registry: registry.value,
        buckets: buckets.value,
        dictionaries: dictionaries.value,
      }),
    )

    async function fetchRemote(): Promise<DefaultCrudEntity | undefined> {
      if (props.id == null) {
        return
      }
      let value: DefaultCrudEntity | undefined
      if (props.page.detail.getDetail) {
        value = await props.page.detail.getDetail(props.id, ctx.value)
      } else {
        const result = (await props.page.service.get(props.id as never)) as RestResult<DefaultCrudEntity>
        if (!isBusinessSuccess(result)) {
          throw new Error(result.message)
        }
        value = result.data as DefaultCrudEntity | undefined
      }
      if (value == null) {
        return
      }
      const merged = {...entity.value, ...value} as DefaultCrudEntity
      return ((await props.page.detail.postGetEntity?.(merged, ctx.value)) ?? merged) as DefaultCrudEntity
    }

    async function load(): Promise<void> {
      try {
        await loadSources()
        const value = await fetchRemote()
        if (value == null) {
          if (props.id != null) {
            message.warning(locale.value.stale.deletedContent)
          }
          return
        }
        entity.value = value
        stale.markBaseline(value)
      } catch (error) {
        message.warning(error instanceof Error ? error.message : String(error))
      }
    }

    async function checkStale(): Promise<void> {
      const info = await stale.check()
      if (info) {
        emit('stale', info)
      }
    }

    expose<CrudDetailPageExpose<DefaultCrudEntity>>({
      get entity() {
        return entity.value
      },
      get buckets() {
        return buckets.value
      },
      get dictionaries() {
        return dictionaries.value
      },
    })

    return () => (
      <DataLoadingCard
        {...(attrs as Record<string, unknown>)}
        onMounted={load}
        onActivated={checkStale}
        v-slots={{
          extra: slots.extra ? () => slots.extra?.() : undefined,
          default: () => (
            <>
              <Descriptions
                bordered
                title={locale.value.basicInformation}
                items={items.value}
                column={props.page.detail.column ?? DEFAULT_COLUMN}
                layout={antdv.state.detailLayout}
              />
              {slots.afterDescriptions?.({
                entity: entity.value,
                extra: props.contextExtra,
                buckets: buckets.value,
                dictionaries: dictionaries.value,
              })}
              {isOperationTraceVisible(props.page.operationDataTraceTarget, entity.value) && (
                <>
                  <Divider titlePlacement="start" plain>
                    <Space>
                      <HistoryOutlined />
                      <span>{locale.value.operationTrace.title}</span>
                    </Space>
                  </Divider>
                  <OperationTraceTable
                    target={props.page.operationDataTraceTarget}
                    entity={entity.value}
                  />
                </>
              )}
              {slots.afterOperationDataTrace?.()}
            </>
          ),
        }}
      />
    )
  },
}) as unknown as CrudDetailPageConstructor

export default CrudDetailPage

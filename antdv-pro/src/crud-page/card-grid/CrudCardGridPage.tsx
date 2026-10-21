import {computed, defineComponent, onMounted, type PropType, type Ref, ref, type SlotsType} from 'vue'
import {App} from 'antdv-next'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useCrudConfig} from '../../crud-config-provider'
import type {ActionAppApis} from '../../_util/crud/actions'
import type {CrudNavigateKind} from '../../_util/crud/navigate'
import CrudCardGrid from '../../crud-card-grid/CrudCardGrid'
import type {CollectionExpose} from '../../_util/crud/collectionExpose'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import {mergeSources} from '../../_util/crud/sources.ts'
import {fetchDataDictionaries, fetchEnumBuckets} from '../../basic-crud-query'
import type {PageDictionaries} from '../../basic-crud-query/types'
import type {QueryCardGridItemActionsSlot, QueryCardGridItemSlot} from '../../query-card-grid/types'
import type {
    CrudCardGridPageConstructor,
    CrudCardGridPageExpose,
    CrudCardGridPageProps,
    CrudCardGridPageSlots,
    PageDeclContext,
} from '../types'

const CrudCardGridPage = defineComponent({
  name: 'LCrudCardGridPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudCardGridPageProps['page']>, required: true},
    variant: String,
    extra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    title: {type: [Object, Boolean] as PropType<CrudCardGridPageProps['title']>, default: undefined},
    query: {type: Object as PropType<CrudCardGridPageProps['query']>, default: undefined},
    plain: {type: Boolean, default: false},
  },
  slots: Object as SlotsType<CrudCardGridPageSlots<DefaultCrudEntity>>,
  setup(props, {attrs, expose, slots}) {
    const config = useCrudConfig()
    const {message, modal} = App.useApp()
    const gridRef = ref<CollectionExpose<DefaultCrudEntity>>()
    const dataSource = ref([]) as Ref<DefaultCrudEntity[]>
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    const collection: CollectionExpose<DefaultCrudEntity> = {
      fetchDataSource: async () => gridRef.value?.fetchDataSource(),
      remove: (records) => gridRef.value?.remove(records),
    }

    const ctx = computed<PageDeclContext>(() => ({variant: props.variant, extra: props.extra}))

    const sources = computed(() => mergeSources({enums: [], dictionaryCodes: []}, props.page.cardGrid))

    async function loadSources(): Promise<void> {
      const [nextBuckets, nextDictionaries] = await Promise.all([
        fetchEnumBuckets(sources.value.enums),
        fetchDataDictionaries(sources.value.dictionaryCodes),
      ])
      buckets.value = nextBuckets
      dictionaries.value = nextDictionaries
    }

    onMounted(() => void loadSources())

    const recordActions = computed(() => {
      const declared = props.page.cardGrid?.recordActions
      return typeof declared === 'function' ? declared(ctx.value) : declared ?? []
    })

    function go(kind: CrudNavigateKind, record?: DefaultCrudEntity): void {
      const target = {kind, name: props.page.routes?.[kind], record, variant: props.variant}
      if (props.page.onNavigate) {
        props.page.onNavigate(target)
        return
      }
      config.value.onNavigate?.(target)
    }

    expose<CrudCardGridPageExpose<DefaultCrudEntity>>({
      fetchDataSource: collection.fetchDataSource,
      clearDataSource: () => {
        dataSource.value = []
      },
      get dataSource() {
        return dataSource.value
      },
      get buckets() {
        return buckets.value
      },
      get dictionaries() {
        return dictionaries.value
      },
    })

    return () => {
      const app: ActionAppApis<DefaultCrudEntity> = {message, modal, collection}
      return (
        <CrudCardGrid
          ref={gridRef}
          service={props.page.service}
          title={props.title}
          query={props.query}
          plain={props.plain}
          rowKey={props.page.rowKey}
          authority={props.page.cardGrid?.authority}
          toolbarActions={props.page.cardGrid?.toolbarActions}
          recordActions={recordActions.value}
          drag={props.page.cardGrid?.drag}
          dataSource={dataSource.value}
          onUpdate:dataSource={(value: DefaultCrudEntity[]) => {
            dataSource.value = value
          }}
          onDrop={(sorts, target, fromIndex, toIndex) =>
            props.page.cardGrid?.onDrop?.({sorts, target, fromIndex, toIndex}, app)
          }
          onAdd={() => go('add')}
          onEdit={(record: DefaultCrudEntity) => go('edit', record)}
          onDetail={(record: DefaultCrudEntity) => go('detail', record)}
          {...(attrs as Record<string, unknown>)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            empty: slots.empty ? () => slots.empty?.() : undefined,
            item: slots.item
              ? (slot: QueryCardGridItemSlot<DefaultCrudEntity>) => slots.item?.(slot)
              : undefined,
            itemActions: slots.itemActions
              ? (slot: QueryCardGridItemActionsSlot<DefaultCrudEntity>) => slots.itemActions?.(slot)
              : undefined,
          }}
        />
      )
    }
  },
}) as unknown as CrudCardGridPageConstructor

export default CrudCardGridPage

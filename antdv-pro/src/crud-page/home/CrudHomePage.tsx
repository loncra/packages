import {computed, defineComponent, type PropType, type Ref, ref, type SlotsType} from 'vue'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {useCrudConfig} from '../../crud-config-provider'
import type {CrudNavigateKind} from '../../_util/crud/navigate'
import CrudTable from '../../crud-table/CrudTable'
import type {CollectionExpose} from '../../_util/crud/collectionExpose'
import type {DefaultCrudEntity} from '../../_util/crud/useCollectionData'
import type {QueryTableBodyCellArgs, QueryTableExpandedRowArgs,} from '../../query-table/types'
import {usePageRegistry} from '../usePageRegistry'
import {buildTableColumns, renderCell, toCellVNode} from './tableColumnsKinds'
import {collectTableSources, mergeSources} from '../sourceLoadsKinds'
import type {PageDictionaries} from '../../basic-crud-query/types'
import type {PageDeclContext} from '../types'
import type {
  CrudHomePageConstructor,
  CrudHomePageExpose,
  CrudHomePageProps,
  CrudHomePageSlots,
  PageTableEntry
} from './types'

const CrudHomePage = defineComponent({
  name: 'LCrudHomePage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudHomePageProps['page']>, required: true},
    variant: String,
    extra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    title: {type: [Object, Boolean] as PropType<CrudHomePageProps['title']>, default: undefined},
    query: {type: Object as PropType<CrudHomePageProps['query']>, default: undefined},
    plain: {type: Boolean, default: false},
  },
  slots: Object as SlotsType<CrudHomePageSlots<DefaultCrudEntity>>,
  setup(props, {attrs, expose, slots}) {
    const config = useCrudConfig()
    const tableRef = ref<CollectionExpose<DefaultCrudEntity>>()
    const dataSource = ref([]) as Ref<DefaultCrudEntity[]>

    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})
    const registry = usePageRegistry()

    const ctx = computed<PageDeclContext>(() => ({variant: props.variant, extra: props.extra}))

    const t = (key: string) =>
      props.page.i18nResolver?.(key) ?? config.value.i18nResolver?.(key) ?? key

    const columnDefs = computed<PageTableEntry<DefaultCrudEntity>[]>(() => props.page.table?.columns ?? [])

    const sources = computed(() =>
      mergeSources(collectTableSources(columnDefs.value, props.page.fields ?? {}), props.page.table),
    )

    const columns = computed(() =>
      buildTableColumns(
        columnDefs.value,
        props.page.fields ?? {},
        t,
        props.page.i18nPrefix,
        buckets.value,
        dictionaries.value,
        ctx.value,
        registry.value,
      ),
    )

    const recordActions = computed(() => {
      const declared = props.page.table?.recordActions
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

    function cellContent(slotProps: {
      column?: {key?: unknown}
      text: unknown
      record: DefaultCrudEntity
    }) {
      const declared = renderCell(
        columnDefs.value,
        props.page.fields ?? {},
        slotProps.column?.key,
        slotProps.record,
        buckets.value,
        dictionaries.value,
        registry.value,
      )
      return toCellVNode(declared === undefined ? slotProps.text : declared)
    }

    expose<CrudHomePageExpose<DefaultCrudEntity>>({
      fetchDataSource: () => tableRef.value?.fetchDataSource(),
      clearDataSource: () => {
        dataSource.value = []
      },
      get dataSource() {
        return dataSource.value
      },
      get buckets() {
        return buckets.value
      },
    })

    const tableAttrs = computed(() => ({scroll: {x: 'max-content'}, ...attrs}))

    return () => {
      return (
        <CrudTable
          ref={tableRef}
          service={props.page.service}
          title={props.title}
          query={props.query}
          plain={props.plain}
          columns={columns.value}
          drag={props.page.table?.drag}
          authority={props.page.table?.authority}
          toolbarActions={props.page.table?.toolbarActions}
          recordActions={recordActions.value}
          rowKey={props.page.rowKey}
          rowSelection={props.page.table?.rowSelection}
          enums={sources.value.enums}
          dictionaryCodes={sources.value.dictionaryCodes}
          dataSource={dataSource.value}
          buckets={buckets.value}
          dictionaries={dictionaries.value}
          onUpdate:dataSource={(value: DefaultCrudEntity[]) => {
            dataSource.value = value
          }}
          onUpdate:buckets={(value: EnumBucketsResponseBody) => {
            buckets.value = value
          }}
          onUpdate:dictionaries={(value: PageDictionaries) => {
            dictionaries.value = value
          }}
          onAdd={() => go('add')}
          onEdit={(record: DefaultCrudEntity) => go('edit', record)}
          onDetail={(record: DefaultCrudEntity) => go('detail', record)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            bodyCell: (slotProps: QueryTableBodyCellArgs) =>
              slots.bodyCell ? slots.bodyCell(slotProps) : cellContent(slotProps),
            expandedRowRender: slots.expandedRowRender
              ? (args: QueryTableExpandedRowArgs) => slots.expandedRowRender?.(args)
              : undefined,
          }}
          {...tableAttrs.value}
        />
      )
    }
  },
}) as unknown as CrudHomePageConstructor

export default CrudHomePage

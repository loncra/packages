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

/**
 * 卡片网格页渲染器：把 `page.list` 的声明翻成 `CrudCardGrid` 的 props。
 *
 * 与 `CrudHomePage` **同一条纪律**（不认路由、不认 i18n、不认弹层；跳转交给 `page.onNavigate` /
 * `CrudConfig.onNavigate`；文案交给 `page.i18nResolver`），差别只有三点：
 *
 * 1. 渲染的是**卡片网格门面**（`CrudCardGrid`）而不是表格；
 * 2. 卡片外观由宿主的 `#item` 插槽画 —— 给了 `#item` 之后，网格内置那张卡（含**动作行与拖拽柄**）
 *    就不会再渲染（见 `QueryCardGrid` 的 `defaultItem` 分支）⇒ 这两样要由 `#item` 自己画，
 *    `itemActions` / `dragEnabled` / `onDragStart` / `onDragEnd` 都在插槽参数里给好了；
 * 3. **来源（枚举桶 / 数据字典）自己拉**：表格那半是基类经 `CrudTable` 拉完再 `update:buckets`
 *    回传的，而 `CrudCardGrid` 不上报桶（`QueryCardGrid` 里连 `buckets` 都没有）⇒ 这里照
 *    `CrudFormPage` 的做法自己拉，并 `expose` 出去给壳用（壳里的 tab / 弹层要用同一份，
 *    别在壳里再发一次同样的请求）。卡片没有"列"，所以来源只能靠声明**显式**给
 *    （`list.enums` / `list.dictionaryCodes`），不做列推导。
 */
const CrudCardGridPage = defineComponent({
  name: 'LCrudCardGridPage',
  inheritAttrs: false,
  props: {
    page: {type: Object as PropType<CrudCardGridPageProps['page']>, required: true},
    variant: String,
    extra: {type: Object as PropType<Record<string, unknown>>, default: () => ({})},
    /** `false` = 不渲染卡片头；`default: undefined` 不能删（同 `CrudHomePage.title` 那个坑） */
    title: {type: [Object, Boolean] as PropType<CrudCardGridPageProps['title']>, default: undefined},
    /** 预置查询条件：同一个声明给多个实例（如"每种 type 一个 tab"）时靠它区分 */
    query: {type: Object as PropType<CrudCardGridPageProps['query']>, default: undefined},
    /** 内嵌形态：透传给基类（不要卡片壳与外层 `Spin`） */
    plain: {type: Boolean, default: false},
  },
  slots: Object as SlotsType<CrudCardGridPageSlots<DefaultCrudEntity>>,
  setup(props, {attrs, expose, slots}) {
    type TEntity = DefaultCrudEntity
    const config = useCrudConfig()
    const {message, modal} = App.useApp()
    const gridRef = ref<CollectionExpose<TEntity>>()
    /** 当前数据（`v-model:data-source` 回流的那份；`clearDataSource` 清它） */
    const dataSource = ref([]) as Ref<TEntity[]>
    const buckets = ref<EnumBucketsResponseBody>({})
    const dictionaries = ref<PageDictionaries>({})

    /** 门面自己持有的"集合能力"：与动作上下文里的 `app.collection` 是同一个东西 */
    const collection: CollectionExpose<TEntity> = {
      fetchDataSource: async () => gridRef.value?.fetchDataSource(),
      remove: (records) => gridRef.value?.remove(records),
    }

    const ctx = computed<PageDeclContext>(() => ({variant: props.variant, extra: props.extra}))

    const sources = computed(() => mergeSources({enums: [], dictionaryCodes: []}, props.page.list))

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
      const declared = props.page.list?.recordActions
      return typeof declared === 'function' ? declared(ctx.value) : declared ?? []
    })

    /**
     * 跳转：与 `CrudHomePage` 一字不差 —— 页面声明给了 `onNavigate` 就用它（`record` 是精确实体），
     * 否则落到 app 级兜底；都没有就什么都不做（内嵌列表安全）。
     */
    function go(kind: CrudNavigateKind, record?: TEntity): void {
      const target = {kind, name: props.page.routes?.[kind], record, variant: props.variant}
      if (props.page.onNavigate) {
        props.page.onNavigate(target)
        return
      }
      config.value.onNavigate?.(target)
    }

    expose<CrudCardGridPageExpose<TEntity>>({
      fetchDataSource: collection.fetchDataSource,
      clearDataSource: () => {
        dataSource.value = []
      },
      // 同 `CrudHomePage`：expose 出去的一律是"值"（Vue 会解包 ref），用 getter 读 ref 保响应式
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
      const app: ActionAppApis<TEntity> = {message, modal, collection}
      return (
        <CrudCardGrid
          ref={gridRef}
          service={props.page.service}
          title={props.title}
          query={props.query}
          plain={props.plain}
          rowKey={props.page.rowKey}
          authority={props.page.list?.authority}
          toolbarActions={props.page.list?.toolbarActions}
          recordActions={recordActions.value}
          drag={props.page.list?.drag}
          dataSource={dataSource.value}
          onUpdate:dataSource={(value: TEntity[]) => {
            dataSource.value = value
          }}
          // 拖拽落库归**声明**（`list.onDrop`）：门面只做转发，pro 不替业务落库
          onDrop={(sorts, target, fromIndex, toIndex) =>
            props.page.list?.onDrop?.({sorts, target, fromIndex, toIndex}, app)
          }
          onAdd={() => go('add')}
          onEdit={(record: TEntity) => go('edit', record)}
          onDetail={(record: TEntity) => go('detail', record)}
          // `$attrs` **排在最后**（与 `CrudHomePage` 的 `tableAttrs` 同一用意）：门面只认声明，
          // 其余原名透传（`:grid-columns` / `:selectable` / `:row-selection` / `:pagination` …）；
          // 宿主真传了同名项（如 `:toolbar-actions` / `:drag`）就是**接管**声明里的那份。
          {...(attrs as Record<string, unknown>)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            empty: slots.empty ? () => slots.empty?.() : undefined,
            item: slots.item
              ? (slot: QueryCardGridItemSlot<TEntity>) => slots.item?.(slot)
              : undefined,
            itemActions: slots.itemActions
              ? (slot: QueryCardGridItemActionsSlot<TEntity>) => slots.itemActions?.(slot)
              : undefined,
          }}
        />
      )
    }
  },
}) as unknown as CrudCardGridPageConstructor

export default CrudCardGridPage

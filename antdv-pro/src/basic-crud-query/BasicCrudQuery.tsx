import {
  computed,
  defineComponent,
  type PropType,
  type Ref,
  type SlotsType,
  toRef,
  useModel,
  type VNode,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {App, Pagination} from 'antdv-next'
import {classNames} from '@loncra/antdv'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {useLocale} from '../_util/useLocale'
import {useActionAuth} from '../crud-config-provider'
import {
  type ToolbarActionContext,
  BUILTIN_BULK_ACTION_IDS,
  BUILTIN_RECORD_ACTION_IDS,
  buildRecordActionContext,
  buildToolbarActionContext,
  mergeDefinitionsNewFirst,
  useActionResolver,
} from '../_util/crud/actions'
import {
  createDefaultBulkActions,
  createDefaultRecordActions,
  createDefaultToolbarActions,
} from '../_util/crud/defaultActions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
  fetchCollectionData,
  patchQuery,
} from '../_util/crud/useCollectionData'
import {useCrudDelete} from '../_util/crud/useCrudDelete'
import DataLoadingCardPlan from '../data-loading-card-plan'
import ActionButton from '../action-button'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {fetchDataDictionaries, fetchEnumBuckets} from './dictionaries'
import type {EnumBucketRequest, PageDictionaries} from './types'
import useStyle from './style'
import type {
  BasicCrudQueryConstructor,
  BasicCrudQueryExpose,
  BasicCrudQueryProps,
  BasicCrudQuerySelectedKey,
  BasicCrudQuerySlots,
} from './types'

/**
 * crud 的**基类**：装的是所有展示形态共用的东西 ——
 *
 * - 数据：`dataSource` / `loading` / `query` / `pagination` / 选中集合（`selectedKey` 指定挂在哪个 prop 上）
 * - 字典：`list.enums` / `list.dictionaryCodes` 在这里拉，结果用 `v-model` 回给建列的地方
 * - 动作：默认定义（add / deleteSelected / edit·detail·delete）+ 声明的合并、解析
 * - 布局：套 `DataLoadingCardPlan`；**标题右侧放权限按钮**；**统一分页由本组件渲染**
 *
 * 内容（表格 / 卡片网格 / 以后别的展示件）由自己填默认插槽，参数里拿到内核（数据 + 动作）。
 */
const BasicCrudQuery = defineComponent({
  name: 'LBasicCrudQuery',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<BasicCrudQueryProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<BasicCrudQueryProps['refreshOnActivate']>,
      default: true,
    },
    /**
     * 卡片头：`VNode` 直接用、`false` 不要卡片头；不给则交给 plan 用 `CrudConfig.resolveDefaultTitle`。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"会被 Vue 的布尔转换变成
     * `false` ⇒ `resolveDefaultTitle` 不会被调用，且本组件的 `extra` 也会 `return null`（工具栏整排消失）。
     */
    title: {type: [Object, Boolean] as PropType<VNode | boolean>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<BasicCrudQueryProps['authority']>,
    /**
     * 标题右侧的工具栏动作：数组 = 与默认合并；`false` = 整排按钮都不出（与 `title` 同形）。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带 `Boolean` 时"不传"会被 Vue 转成 `false`。
     */
    toolbarActions: {
      type: [Array, Boolean] as PropType<BasicCrudQueryProps['toolbarActions']>,
      default: undefined,
    },
    /**
     * 行内 / 项内动作：数组 = 与默认合并；`false` = 不要（与 `title` 同形）。
     *
     * ⚠️ **`default: undefined` 不能删**：不传被转成 `false` 时，本组件 `hasRecordActions` 里的
     * `props.recordActions !== false` 直接判"没有行内动作" ⇒ **"操作"列整列不补**（见 `:284`）。
     */
    recordActions: {
      type: [Array, Boolean] as PropType<BasicCrudQueryProps['recordActions']>,
      default: undefined,
    },
    /**
     * 朴素卡片：去掉卡片壳边框 + body 内边距（样式见本目录 `style/index.ts` 的 `-plain`）。
     * 卡片根就是本组件的根元素，所以只需给它加一个带 hashId 的类。
     */
    plain: {type: Boolean, default: false},
    /** 选中集合挂在哪：表格 `selectedRows` / 卡片 `selectedItems` */
    selectedKey: {type: String as PropType<BasicCrudQuerySelectedKey>, default: 'selectedRows'},
    // 数据
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {type: Object as PropType<FilterRequest | PageRequest>, default: () => ({})},
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    selectedItems: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    // 字典（枚举桶按模块分组）
    enums: Array as PropType<EnumBucketRequest[]>,
    dictionaryCodes: Array as PropType<(string | undefined)[]>,
    buckets: {type: Object as PropType<EnumBucketsResponseBody>, default: () => ({})},
    dictionaries: {type: Object as PropType<PageDictionaries>, default: () => ({})},
    prefixCls: String,
    rootClass: String,
  },
  emits: [
    'update:dataSource',
    'update:loading',
    'update:query',
    'update:selectedRows',
    'update:selectedItems',
    'update:pagination',
    'update:buckets',
    'update:dictionaries',
    'action',
    'add',
    'edit',
    'detail',
    'deleted',
  ],
  slots: Object as SlotsType<BasicCrudQuerySlots>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TBody = DefaultCrudEntity
    type TId = string | number
    const {message, modal} = App.useApp()
    const locale = useLocale('Crud')
    const config = useConfig()
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const resolver = useActionResolver()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('basic-crud-query', props.prefixCls ?? 'loncra-basic-crud-query'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    // 双向绑定：父级 v-model 时纯受控（写操作 emit 回流），未绑时写本地值并 emit
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
    const selected = useModel(props, props.selectedKey) as unknown as Ref<TEntity[]>
    const buckets = useModel(props, 'buckets') as unknown as Ref<EnumBucketsResponseBody>
    const dictionaries = useModel(props, 'dictionaries') as unknown as Ref<PageDictionaries>

    /** 取数：`loading` 由这里开关（挂载 / 切回那两个口由 plan 触发，它自己也会点 loading） */
    async function fetchDataSource() {
      loading.value = true
      try {
        dataSource.value = await fetchCollectionData({
          service: props.service as never,
          query: query.value,
          pagination: pagination as never,
        })
        emit('update:pagination', pagination.value)
      } finally {
        loading.value = false
      }
    }

    /** 统一分页：页码变化 = 改查询条件 + 重取 */
    function onPageChange(page: number, pageSize: number) {
      patchQuery(query, {number: page, size: pageSize})
      void fetchDataSource()
    }

    /** 系统字典：与列表数据同一批、只在挂载时拉一次 */
    async function loadDictionaries() {
      const [nextBuckets, nextDictionaries] = await Promise.all([
        fetchEnumBuckets(props.enums),
        fetchDataDictionaries(props.dictionaryCodes),
      ])
      buckets.value = nextBuckets
      dictionaries.value = nextDictionaries
    }

    /** plan 的 `onMounted` 口：字典 + 首屏（`immediate: false` 时只拉字典） */
    async function onPlanMounted() {
      await loadDictionaries()
      if (props.immediate) {
        await fetchDataSource()
      }
    }

    /** plan 的 `onActivated` 口：切回刷新策略 */
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

    // 本组件就是集合的宿主：这份能力既 expose 给外层，也注入动作上下文（一处定义、两处共用）
    const collection: CollectionExpose<TEntity> = {fetchDataSource, remove}

    // ── 动作：默认定义 + 声明合并，解析一次
    const actionContext = computed<ToolbarActionContext<TEntity>>(() =>
      buildToolbarActionContext({
        items: dataSource.value,
        selectedItems: selected.value,
        query: query.value,
        app: {message, modal, collection},
      }),
    )

    /**
     * 工具栏定义：**声明的在前**，默认动作在下（`add` + `deleteSelected`）；
     * `toolbarActions === false` 整排都不要。
     */
    const toolbarDefinitions = computed(() => {
      if (props.toolbarActions === false) {
        return []
      }
      return mergeDefinitionsNewFirst(
        [
          ...createDefaultToolbarActions<TEntity>({
            authority: props.authority,
            locale: locale.value,
            iconClass: 'align',
            onAdd: (ctx) => {
              emit('add')
              emit('action', {id: 'add', context: ctx})
            },
          }),
          ...createDefaultBulkActions<TBody, TEntity, TId>({
            authority: props.authority,
            service: props.service,
            locale: locale.value,
            remove,
          }),
        ],
        Array.isArray(props.toolbarActions) ? props.toolbarActions : [],
      )
    })
    const toolbarActions = computed(() =>
      resolver.resolveToolbarActions(toolbarDefinitions.value, actionContext.value, auth),
    )

    /** 需要自动开行选择：工具栏定义里出现了内置批量动作（默认就带一个 `deleteSelected`） */
    const needsBulkSelection = computed(() =>
      toolbarDefinitions.value.some((def) =>
        BUILTIN_BULK_ACTION_IDS.includes(def.id as (typeof BUILTIN_BULK_ACTION_IDS)[number]),
      ),
    )

    /** 行内定义：**声明的在前**，默认动作在下（`edit` / `detail` / `delete`） */
    const recordDefinitions = computed(() =>
      mergeDefinitionsNewFirst(
        createDefaultRecordActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove,
          onEdit: (record) => emit('edit', record),
          onDetail: (record) => emit('detail', record),
        }),
        Array.isArray(props.recordActions) ? props.recordActions : [],
      ),
    )

    function recordContext(record: TEntity) {
      return buildRecordActionContext({record, app: {message, modal, collection}})
    }

    const resolveRecordActions = (record: TEntity) =>
      props.recordActions === false
        ? []
        : resolver.resolveRecordActions(recordDefinitions.value, recordContext(record), auth)

    function onRecordAction(id: string, record: TEntity) {
      if (BUILTIN_RECORD_ACTION_IDS.includes(id as (typeof BUILTIN_RECORD_ACTION_IDS)[number])) {
        return
      }
      emit('action', {id, context: recordContext(record)})
    }

    const hasRecordActions = computed(() =>
      props.recordActions !== false && recordDefinitions.value.some((def) => auth.can(def.permission)),
    )

    expose<BasicCrudQueryExpose<TEntity, TId>>({
      ...collection,
      resolveRecordActions,
      onRecordAction,
      /**
       * **expose 出去的一律是"值"**：Vue 会把 exposed 的 ref / computed 解包（`proxyRefs`），
       * 所以契约里写的是 `boolean`。这里用 getter 读 ref ⇒ 对外是当前值，
       * 消费方在 computed / 渲染里读它仍然会跟着变（响应式不丢）。
       */
      get hasRecordActions() {
        return hasRecordActions.value
      },
      get needsBulkSelection() {
        return needsBulkSelection.value
      },
    })

    /** `plain`：卡片根就是本组件的根元素，加一个带 hashId 的类即可命中 `-plain` 的样式 */
    const plainClass = computed(() =>
      props.plain
        ? classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-plain`)
        : undefined,
    )

    return () => (
      <DataLoadingCardPlan
        {...attrs}
        class={classNames(attrs.class as string | undefined, plainClass.value)}
        loading={loading.value}
        onUpdate:loading={(value: boolean) => (loading.value = value)}
        onMounted={onPlanMounted}
        onActivated={onPlanActivated}
        title={props.title}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          // 标题右侧：不要卡片头或不要工具栏动作时整块都不出（连 `#extra` 一起关）；否则插槽优先、没插槽就用动作按钮
          extra: () => {
            if (props.title === false || props.toolbarActions === false) {
              return null
            }
            return slots.extra ? slots.extra() : <ActionButton actions={toolbarActions.value} />
          },
          default: () => (
            <>
              {slots.default?.()}
              {pagination.value === false ? null : (
                <Pagination
                  class={classNames(
                    prefixCls.value,
                    hashId.value,
                    cssVarCls.value,
                    `${prefixCls.value}-pagination`,
                  )}
                  {...(pagination.value as Record<string, unknown>)}
                  onChange={onPageChange}
                />
              )}
            </>
          ),
        }}
      />
    )
  },
}) as unknown as BasicCrudQueryConstructor

export default BasicCrudQuery

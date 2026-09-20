import {
  computed,
  defineComponent,
  h,
  type PropType,
  type Ref,
  ref,
  type SlotsType,
  toRef,
  useModel,
  watch,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {Button, Space, SpaceCompact, Table, Typography} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {DeleteOutlined, FilterOutlined, SearchOutlined, UndoOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import BasicCrudQuery from '../basic-crud-query'
import type {BasicCrudQueryExpose, PageDicts, PageEnums} from '../basic-crud-query'
import {useMergeRowSelection} from '../_util/crud/useMergeRowSelection'
import {isDragEnabled} from '../_util/crud/useDrag'
import {useTableRowDrag} from '../_util/crud/useTableRowDrag'
import ActionButton from '../action-button'
import useStyle from './style'
import type {
  AuthorityProps,
  DefaultCrudEntity,
  QueryTableConstructor,
  QueryTableEmits,
  QueryTableExpose,
  QueryTableProps,
  QueryTableRuntimeProps,
  QueryTableSlots,
  RefreshOnActivate,
  SearchableColumnType,
} from './types'

const QUERY_TABLE_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedRows',
  'update:pagination',
  'update:buckets',
  'update:dicts',
  'action',
  'add',
  'edit',
  'detail',
  'deleted',
  'drop',
  'treeDrop',
] as const

/**
 * 表格：**只画表格**（列、筛选、拖拽列、空壳筛选下拉、槽）。
 *
 * 取数 / 分页 / 字典 / 标题 / 动作全部由 `BasicCrudQuery` 基类做（本组件把数据 model
 * `v-model` 交给它，并把它 expose 的能力转发出去）。所以要"贴边"之类的卡片外观，
 * 在门面那层给 `classes`（基类会把 `$attrs` 交给 `DataLoadingCardPlan` 的 `Card`）。
 */
const QueryTable = defineComponent({
  name: 'LQueryTable',
  inheritAttrs: false,
  props: {
    // ── 交给基类的（外壳层） ──
    service: {type: Object as PropType<QueryTableRuntimeProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
    title: [Object, Boolean] as PropType<QueryTableRuntimeProps['title']>,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    /** 标题右侧的工具栏动作：数组 = 与默认 `add`/`deleteSelected` 合并；`false` = 整排不出 */
    toolbarActions: [Array, Boolean] as PropType<QueryTableRuntimeProps['toolbarActions']>,
    /** 行内动作：数组 = 与默认 `edit`/`detail`/`delete` 合并；`false` = 不要（`操作`列也不补） */
    recordActions: [Array, Boolean] as PropType<QueryTableRuntimeProps['recordActions']>,
    /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dicts`）—— 原样交给基类 */
    enumIds: Array as PropType<QueryTableRuntimeProps['enumIds']>,
    dictCodes: Array as PropType<QueryTableRuntimeProps['dictCodes']>,
    prefixCls: String,
    rootClass: String,
    // ── 表格自己的 ──
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    bordered: {type: Boolean, default: true},
    /** 拖拽开关 + 幽灵内容：`true` = 可拖（幽灵缺省主键）；`(record) => 内容` = 可拖且它就是幽灵 */
    drag: [Boolean, Function] as PropType<QueryTableRuntimeProps['drag']>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowKey: {
      type: [String, Function] as PropType<TableProps['rowKey']>,
      default: SYSTEM_CONSTANT.ID_NAME,
    },
    rowSelection: [Object, Boolean] as PropType<TableProps['rowSelection'] | false>,
    // ── 数据 model（本组件持有，`v-model` 传给基类） ──
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({hideOnSinglePage: true, align: 'center'}),
    },
    /** 字典加载结果（基类拉完 `v-model` 回来） */
    buckets: {type: Object as PropType<QueryTableRuntimeProps['buckets']>, default: () => ({})},
    dicts: {type: Object as PropType<QueryTableRuntimeProps['dicts']>, default: () => ({})},
  },
  emits: [...QUERY_TABLE_EMITS],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number

    const locale = useLocale('Crud')
    const config = useConfig()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('query-table', props.prefixCls ?? 'loncra-query-table'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)
    /** 基类实例：取数 / 分页 / 标题 / 动作都在它那儿 */
    const basic = ref<BasicCrudQueryExpose<TEntity, TId>>()

    // 双向绑定：父级 v-model 时纯受控（写操作 emit 回流），未绑时写本地值并 emit。
    // localValue 与 props 保持同一引用，父级「改对象属性」也能立即生效（不再需要 watch 拷贝）。
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const selectedRows = useModel(props, 'selectedRows') as unknown as Ref<TEntity[]>
    const tablePagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
    const buckets = useModel(props, 'buckets') as unknown as Ref<PageEnums>
    const dicts = useModel(props, 'dicts') as unknown as Ref<PageDicts>
    const tableColumns = ref<SearchableColumnType<TEntity>[]>([])
    const appliedDefaultValueKeys = new Set<string>()

    const ghostClass = computed(() =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
    )
    const dropClassPrefix = computed(() => classNames(hashId.value, prefixCls.value))
    const dragEnabled = computed(() => isDragEnabled(props.drag))

    const {
      tableOnRow,
      applyDragColumn,
      isDragCell,
      onDragHandleStart,
      onDragHandleEnd,
      syncPlacementBaseline,
    } = useTableRowDrag<TEntity, TId>({
      drag: toRef(props, 'drag'),
      // 拖拽的同一性判断也要跟 rowKey 对齐（rowKey 是函数时拿不到字段名，回退 id）
      idKey: (typeof props.rowKey === 'string' ? props.rowKey : undefined) as keyof TEntity & string | undefined,
      dataSource,
      onRow: toRef(props, 'onRow'),
      ghostClass,
      dropClassPrefix,
      onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
        emit('drop', sorts, target, fromIndex, toIndex),
      onTreeDrop: ({sorts, drag, target, dropPosition, tree}) =>
        emit('treeDrop', sorts, drag, target, {dropPosition, tree}),
    })

    /** "操作"列要不要补：基类已经算过 `recordActions === false` 与权限，表格只负责画 */
    const hasActionsColumn = computed(() => basic.value?.hasRecordActions.value ?? false)

    const externalRowSelection = computed((): TableProps['rowSelection'] | false | null => {
      const raw = (props.rowSelection ?? attrs.rowSelection) as
        | TableProps['rowSelection']
        | false
        | undefined
      if (raw === false) {
        return null
      }
      // 没有批量动作（基类看的）就不自动开多选
      if (raw === undefined && !(basic.value?.needsBulkSelection.value ?? false)) {
        return null
      }
      return raw ?? {fixed: true, type: 'checkbox' as const}
    })

    // 选择态合并要跟 rowKey 对齐；rowKey 是函数时拿不到字段名，回退成 id
    const mergeIdKey = (
      typeof props.rowKey === 'string' ? props.rowKey : SYSTEM_CONSTANT.ID_NAME
    ) as keyof TEntity & string
    const {rowSelection: mergedRowSelection} = useMergeRowSelection<TEntity, TId>(
      externalRowSelection,
      selectedRows,
      mergeIdKey,
    )

    const tablePassthroughAttrs = computed(() => {
      // `classes` 是卡片（plan 的 `Card`）的外观，交给基类；其余未知 attrs 照旧落表格
      const {class: _class, style: _style, rowSelection: _rowSelection, classes: _classes, ...rest} = attrs
      if (rest.scroll === undefined) {
        const cols = tableColumns.value
        const allSized = cols.length > 0 && cols.every((column) => column.width != null)
        rest.scroll = {
          x: allSized ? cols.reduce((sum, column) => sum + Number(column.width), 0) : 'max-content',
        }
      }
      return rest
    })

    function patchQuery(patch: FilterRequest) {
      query.value = {...query.value, ...patch}
    }

    function fetch() {
      void basic.value?.fetchDataSource()
    }

    function doSearch(
      column: SearchableColumnType<TEntity>,
      setSelectedKeys: (keys: string[]) => void,
      confirm: () => void,
    ) {
      if (column.search?.queryName) {
        const value = query.value[column.search.queryName] ?? ''
        const keys = value !== '' && value != null ? [String(value)] : []
        setSelectedKeys(keys)
      }
      confirm()
      fetch()
    }

    function clear(confirm: () => void, setSelectedKeys: (keys: string[]) => void) {
      const next: FilterRequest | PageRequest = {...query.value}
      for (const column of tableColumns.value) {
        if (!column.search?.queryName) {
          continue
        }
        next[column.search.queryName] = ''
        column.filteredValue = null
      }
      query.value = next
      setSelectedKeys([])
      confirm()
      fetch()
    }

    function resetField(
      column: SearchableColumnType<TEntity>,
      setSelectedKeys: (keys: string[]) => void,
      confirm: () => void,
    ) {
      if (column.search?.queryName) {
        patchQuery({[column.search.queryName]: ''})
      }
      setSelectedKeys([])
      confirm()
      fetch()
    }

    function onFilterEnterKey(
      e: KeyboardEvent,
      column: SearchableColumnType<TEntity>,
      setSelectedKeys: (keys: string[]) => void,
      confirm: () => void,
    ) {
      if (e.key !== 'Enter' || e.shiftKey) {
        return
      }
      const el = e.target as HTMLElement | null
      if (!el || el.tagName === 'TEXTAREA' || el.isContentEditable) {
        return
      }
      if (el.closest('.ant-select') || el.closest('.ant-picker')) {
        return
      }
      const input = el.closest('input')
      if (!input) {
        return
      }
      if (['button', 'checkbox', 'radio'].includes(input.type)) {
        return
      }
      e.preventDefault()
      doSearch(column, setSelectedKeys, confirm)
    }

    function rebuildColumns() {
      const cols: SearchableColumnType<TEntity>[] = []
      for (const col of props.columns ?? []) {
        const optionsCol: SearchableColumnType<TEntity> = {
          ...col,
          ...(col.search ? {search: {...col.search}} : {}),
        }
        cols.push(optionsCol)
        if (!optionsCol.search?.component) {
          continue
        }
        optionsCol.filterDropdown = () => null
        if (!optionsCol.search.queryName) {
          optionsCol.search.queryName = `filter_[${String(col.key)}_${optionsCol.search.expression || 'eq'}]`
        }
        const queryName = optionsCol.search.queryName
        if (
          optionsCol.search.defaultValue !== undefined &&
          !appliedDefaultValueKeys.has(queryName)
        ) {
          appliedDefaultValueKeys.add(queryName)
          patchQuery({[queryName]: optionsCol.search.defaultValue})
        }
      }
      if (hasActionsColumn.value) {
        cols.push({
          title: locale.value.action,
          dataIndex: 'action',
          key: 'action',
          align: 'center',
          width: 80,
          fixed: 'right',
        })
      }
      tableColumns.value = applyDragColumn(cols)
    }

    watch(
      () => [props.columns, props.drag, hasActionsColumn.value] as const,
      () => rebuildColumns(),
      {immediate: true, deep: true},
    )

    watch(
      dataSource,
      (tree) => {
        if (!dragEnabled.value) {
          return
        }
        syncPlacementBaseline(tree)
      },
      {deep: true},
    )

    expose<QueryTableExpose<TEntity, TId>>({
      fetchDataSource: async () => basic.value?.fetchDataSource(),
      remove: (records) => basic.value?.remove(records),
    })

    return () => {
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrs.class,
      )

      type FilterDropdownArgs = {
        column: SearchableColumnType<TEntity>
        setSelectedKeys: (keys: string[]) => void
        confirm: () => void
      }

      const renderFilterDropdown = ({column, setSelectedKeys, confirm}: FilterDropdownArgs) => {
        const search = column.search
        if (!search?.component) {
          return null
        }
        const SearchComponent = search.component
        const queryName = search.queryName ?? ''
        return (
          <div
            class={classNames(
              hashId.value,
              cssVarCls.value,
              `${prefixCls.value}-filter-dropdown`,
            )}
            onKeydown={(e: KeyboardEvent) => {
              e.stopPropagation()
              onFilterEnterKey(e, column, setSelectedKeys, confirm)
            }}
          >
            <Space orientation="vertical">
              {h(SearchComponent, {
                ...(search.props ?? {}),
                value: query.value[queryName],
                'onUpdate:value': (value: FilterRequest[string]) => {
                  patchQuery({[queryName]: value})
                },
              })}
              <SpaceCompact block>
                <Button
                  block
                  type="primary"
                  onClick={() => doSearch(column, setSelectedKeys, confirm)}
                  v-slots={{icon: () => h(SearchOutlined)}}
                >
                  <span>{locale.value.search}</span>
                </Button>
                <Button
                  block
                  onClick={() => resetField(column, setSelectedKeys, confirm)}
                  v-slots={{icon: () => h(UndoOutlined)}}
                >
                  <span>{locale.value.reset}</span>
                </Button>
                <Button
                  block
                  onClick={() => clear(confirm, setSelectedKeys)}
                  v-slots={{icon: () => h(DeleteOutlined)}}
                >
                  <span>{locale.value.clear}</span>
                </Button>
              </SpaceCompact>
            </Space>
          </div>
        )
      }

      const DataTable = Table as any
      return (
        <BasicCrudQuery
          ref={basic}
          service={props.service}
          immediate={props.immediate}
          refreshOnActivate={props.refreshOnActivate}
          title={props.title}
          hasPermission={props.hasPermission}
          authority={props.authority}
          toolbarActions={props.toolbarActions}
          recordActions={props.recordActions}
          enumIds={props.enumIds}
          dictCodes={props.dictCodes}
          selectedKey="selectedRows"
          prefixCls={props.prefixCls}
          rootClass={props.rootClass}
          {...({classes: attrs.classes} as Record<string, unknown>)}
          dataSource={dataSource.value}
          loading={loading.value}
          query={query.value}
          selectedRows={selectedRows.value}
          pagination={tablePagination.value}
          buckets={buckets.value}
          dicts={dicts.value}
          onUpdate:dataSource={(value: TEntity[]) => (dataSource.value = value)}
          onUpdate:loading={(value: boolean) => (loading.value = value)}
          onUpdate:query={(value: FilterRequest | PageRequest) => (query.value = value)}
          onUpdate:selectedRows={(value: TEntity[]) => (selectedRows.value = value)}
          onUpdate:pagination={(value: unknown) => (tablePagination.value = value as TableProps['pagination'])}
          onUpdate:buckets={(value: PageEnums) => (buckets.value = value)}
          onUpdate:dicts={(value: PageDicts) => (dicts.value = value)}
          onAction={(payload) => emit('action', payload)}
          onAdd={() => emit('add')}
          onEdit={(record: TEntity) => emit('edit', record)}
          onDetail={(record: TEntity) => emit('detail', record)}
          onDeleted={(records: TEntity[]) => emit('deleted', records)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            default: () => (
              <DataTable
                {...(tablePassthroughAttrs.value as Record<string, unknown>)}
                class={hashedClass}
                style={attrs.style}
                columns={tableColumns.value}
                pagination={false}
                rowKey={props.rowKey}
                dataSource={dataSource.value}
                rowSelection={mergedRowSelection.value}
                loading={loading.value}
                bordered={props.bordered}
                onRow={tableOnRow.value}
                v-slots={{
                  bodyCell: ({
                    text,
                    record,
                    index,
                    column,
                  }: {
                    text: unknown
                    record: TEntity
                    index: number
                    column: SearchableColumnType<TEntity>
                  }) => {
                    if (isDragCell(column)) {
                      return (
                        <div
                          class={classNames(hashId.value, `${prefixCls.value}-drag-handle`)}
                          draggable
                          onDragstart={(e: DragEvent) => onDragHandleStart(record, e)}
                          onDragend={onDragHandleEnd}
                        >
                          <Typography.Text type="secondary">::</Typography.Text>
                        </div>
                      )
                    }
                    if (column.dataIndex === 'action') {
                      return (
                        <>
                          {slots.bodyCell?.({
                            text,
                            record,
                            index,
                            column: column as SearchableColumnType<TEntity>,
                          })}
                          <ActionButton
                            size="small"
                            actions={basic.value?.resolveRecordActions(record) ?? []}
                            onAction={(id: string) => basic.value?.onRecordAction(id, record)}
                          />
                        </>
                      )
                    }
                    return slots.bodyCell?.({
                      text,
                      record,
                      index,
                      column: column as SearchableColumnType<TEntity>,
                    })
                  },
                  filterIcon: ({filtered}: {filtered: boolean}) =>
                    h(FilterOutlined, {
                      class: classNames(filtered && `${prefixCls.value}-filter-icon-active`),
                    }),
                  filterDropdown: renderFilterDropdown,
                  expandedRowRender: slots.expandedRowRender
                    ? (args: {record: TEntity; index: number; indent: number; expanded: boolean}) =>
                        slots.expandedRowRender?.(args)
                    : undefined,
                }}
              />
            ),
          }}
        />
      )
    }
  },
}) as unknown as QueryTableConstructor

export default QueryTable
export type {
  QueryTableConstructor,
  QueryTableEmits,
  QueryTableExpose,
  QueryTableProps,
  QueryTableSlots,
}

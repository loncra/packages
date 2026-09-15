import {
  computed,
  defineComponent,
  h,
  onActivated,
  onMounted,
  type PropType,
  provide,
  ref,
  type SlotsType,
  toRef,
  watch,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {App, Button, Flex, Space, SpaceCompact, Table, Typography} from 'antdv-next'
import type {TablePaginationConfig} from 'antdv-next/dist/table/interface'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames, renderIconFont} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth, useCrudConfig} from '../crud-config-provider'
import {
  ACTION_CONTEXT_KEY,
  type ActionContext,
  type ActionDefinition,
  BUILTIN_BULK_ACTION_IDS,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultToolbarActions} from '../_util/crud/defaultActions'
import {type CollectionPagination, exportCollectionData, fetchCollectionData,} from '../_util/crud/useCollectionData'
import {useMergeRowSelection} from '../_util/crud/useMergeRowSelection'
import {useTableRowDrag} from '../_util/crud/useTableRowDrag'
import ActionButton from '../action-button'
import useStyle from './style'
import type {
  AuthorityProps,
  ColumnSearchConfig,
  DefaultCrudEntity,
  QueryTableConstructor,
  QueryTableEmits,
  QueryTableExpose,
  QueryTableProps,
  QueryTableRuntimeProps,
  QueryTableSlots,
  SearchableColumnType,
} from './types'

const QUERY_TABLE_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedRows',
  'update:pagination',
  'action',
  'exported',
  'drop',
  'treeDrop',
] as const

const QueryTable = defineComponent({
  name: 'LQueryTable',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryTableRuntimeProps['service']>, required: true},
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    immediate: {type: Boolean, default: true},
    hideTitle: {type: Boolean, default: false},
    bordered: {type: Boolean, default: true},
    title: String,
    titleIcon: String,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    actionContextExtras: Object as PropType<Record<string, unknown>>,
    drag: Boolean,
    formatDragPreview: Function as PropType<(record: DefaultCrudEntity) => string>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowSelection: [Object, Boolean] as PropType<TableProps['rowSelection'] | false>,
    pagination: {
      type: [Object, Boolean] as PropType<TableProps['pagination']>,
      default: () => ({hideOnSinglePage: true, placement: ['bottomCenter']}),
    },
    prefixCls: String,
    rootClass: String,
    dataSource: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
    loading: {type: Boolean, default: false},
    query: {
      type: Object as PropType<FilterRequest | PageRequest>,
      default: () => ({}),
    },
    selectedRows: {type: Array as PropType<DefaultCrudEntity[]>, default: () => []},
  },
  emits: [...QUERY_TABLE_EMITS],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TId = string | number
    type TableColumn = {
      title?: unknown
      dataIndex?: unknown
      key?: string | number
      width?: number | string
      align?: unknown
      fixed?: unknown
      search?: ColumnSearchConfig
      filteredValue?: unknown
      filterDropdown?: unknown
    }
    const {message} = App.useApp()
    const locale = useLocale('Crud')
    const config = useConfig()
    const crudConfig = useCrudConfig()
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const {resolveActions} = useActionResolver()
    const prefixCls = computed(() =>
      config.value.getPrefixCls('query-table', props.prefixCls ?? 'loncra-query-table'),
    )
    const [hashId, cssVarCls] = useStyle(prefixCls)

    const dataSourceInner = ref<TEntity[]>([...(props.dataSource ?? [])])
    const loadingInner = ref(props.loading ?? false)
    const queryInner = ref<FilterRequest | PageRequest>({...(props.query ?? {})})
    const selectedRowsInner = ref<TEntity[]>([...(props.selectedRows ?? [])])

    watch(
      () => props.dataSource,
      (value) => {
        dataSourceInner.value = value ?? []
      },
    )
    watch(
      () => props.loading,
      (value) => {
        loadingInner.value = value ?? false
      },
    )
    watch(
      () => props.query,
      (value) => {
        queryInner.value = value ?? {}
      },
    )
    watch(
      () => props.selectedRows,
      (value) => {
        selectedRowsInner.value = value ?? []
      },
    )

    const dataSource = computed({
      get: () => dataSourceInner.value,
      set: (value: TEntity[]) => {
        dataSourceInner.value = value
        emit('update:dataSource', value)
      },
    })
    const loading = computed({
      get: () => loadingInner.value,
      set: (value: boolean) => {
        loadingInner.value = value
        emit('update:loading', value)
      },
    })
    const query = computed({
      get: () => queryInner.value,
      set: (value: FilterRequest | PageRequest) => {
        queryInner.value = value
        emit('update:query', value)
      },
    })
    const selectedRows = computed({
      get: () => selectedRowsInner.value,
      set: (value: TEntity[]) => {
        selectedRowsInner.value = value
        emit('update:selectedRows', value)
      },
    })

    const tablePagination = ref<TableProps['pagination']>(props.pagination)
    watch(
      () => props.pagination,
      (value) => {
        tablePagination.value = value
      },
    )
    const hasFetched = ref(false)
    const tableColumns = ref<TableColumn[]>([])
    const appliedDefaultValueKeys = new Set<string>()

    const ghostClass = computed(() =>
      classNames(hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
    )
    const dropClassPrefix = computed(() => classNames(hashId.value, prefixCls.value))
    const dragEnabled = computed(() => !!props.drag)

    const {
      tableOnRow,
      applyDragColumn,
      isDragCell,
      onDragHandleStart,
      onDragHandleEnd,
      syncPlacementBaseline,
    } = useTableRowDrag<TEntity, TId>({
      drag: dragEnabled,
      dataSource,
      formatDragPreview: (record) =>
        props.formatDragPreview?.(record) ?? String(record[SYSTEM_CONSTANT.ID_NAME] ?? ''),
      onRow: toRef(props, 'onRow'),
      ghostClass,
      dropClassPrefix,
      onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
        emit('drop', sorts, target, fromIndex, toIndex),
      onTreeDrop: ({sorts, drag, target, dropPosition, tree}) =>
        emit('treeDrop', sorts, drag, target, {dropPosition, tree}),
    })

    const actionContext = computed<ActionContext<TEntity>>(() => ({
      scope: 'toolbar',
      items: dataSource.value,
      selectedItems: selectedRows.value,
      query: query.value,
      extras: props.actionContextExtras ?? {},
    }))

    provide(ACTION_CONTEXT_KEY, actionContext)

    const defaultTableActions = computed(() =>
      createDefaultToolbarActions<TEntity>({
        authority: props.authority,
        locale: locale.value,
        iconClass: 'align',
        onAdd: (ctx) => emit('action', {id: 'add', context: ctx}),
        onExport: (ctx) => exportData(ctx.selectedItems),
      }),
    )

    const titleActions = computed(() =>
      resolveActions(
        mergeDefinitions(defaultTableActions.value, props.actions ?? []),
        actionContext.value,
        auth,
      ),
    )

    const needsBulkRowSelection = computed(() => {
      if (auth.can(props.authority?.export) || auth.can(props.authority?.delete)) {
        return true
      }
      return (props.actions ?? []).some((action) =>
        BUILTIN_BULK_ACTION_IDS.includes(action.id as (typeof BUILTIN_BULK_ACTION_IDS)[number]),
      )
    })

    const externalRowSelection = computed((): TableProps['rowSelection'] | false | null => {
      const raw = (props.rowSelection ?? attrs.rowSelection) as
        | TableProps['rowSelection']
        | false
        | undefined
      if (raw === false) {
        return null
      }
      if (raw === undefined && !needsBulkRowSelection.value) {
        return null
      }
      return raw ?? {fixed: true, type: 'checkbox' as const}
    })

    const {rowSelection: mergedRowSelection} = useMergeRowSelection<TEntity, TId>(
      externalRowSelection,
      selectedRows,
    )

    const resolvedTitle = computed(() => {
      if (props.title !== undefined || props.titleIcon !== undefined) {
        return {title: props.title ?? '', icon: props.titleIcon ?? 'loncra-file'}
      }
      const fromConfig = crudConfig.value.resolveDefaultTitle?.()
      return {title: fromConfig?.title ?? '', icon: fromConfig?.icon ?? 'loncra-file'}
    })

    const tablePassthroughAttrs = computed(() => {
      const {class: _class, style: _style, rowSelection: _rowSelection, ...rest} = attrs
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

    function doSearch(
      column: TableColumn,
      setSelectedKeys: (keys: string[]) => void,
      confirm: () => void,
    ) {
      if (column.search?.queryName) {
        const value = query.value[column.search.queryName] ?? ''
        const keys = value !== '' && value != null ? [String(value)] : []
        setSelectedKeys(keys)
      }
      confirm()
      void fetchDataSource()
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
      void fetchDataSource()
    }

    function resetField(
      column: TableColumn,
      setSelectedKeys: (keys: string[]) => void,
      confirm: () => void,
    ) {
      if (column.search?.queryName) {
        patchQuery({[column.search.queryName]: ''})
      }
      setSelectedKeys([])
      confirm()
      void fetchDataSource()
    }

    function onChange(pagination: TablePaginationConfig) {
      patchQuery({
        number: pagination.current,
        size: pagination.pageSize || 10,
      })
      void fetchDataSource()
    }

    function onFilterEnterKey(
      e: KeyboardEvent,
      column: TableColumn,
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
      const cols: TableColumn[] = []
      for (const col of props.columns ?? []) {
        const optionsCol: TableColumn = {
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
      tableColumns.value = applyDragColumn(cols)
    }

    const collectionPagination = computed({
      get: () => tablePagination.value as CollectionPagination | undefined,
      set: (value: CollectionPagination | undefined) => {
        tablePagination.value = value
      },
    })

    async function fetchDataSource() {
      try {
        loading.value = true
        dataSource.value = await fetchCollectionData({
          service: props.service,
          query: query.value,
          pagination: collectionPagination as never,
        })
        syncPlacementBaseline(dataSource.value)
        emit('update:pagination', tablePagination.value)
      } finally {
        loading.value = false
      }
    }

    async function exportData(records: TEntity[]) {
      const result = await exportCollectionData({
        service: props.service,
        query: query.value,
        records,
      })
      message.success(result.message)
      emit('exported', result)
      crudConfig.value.onExported?.(result)
    }

    watch(
      () => [props.columns, props.drag] as const,
      () => rebuildColumns(),
      {immediate: true, deep: true},
    )

    watch(
      dataSource,
      (tree) => {
        if (!props.drag) {
          return
        }
        syncPlacementBaseline(tree)
      },
      {deep: true},
    )

    onMounted(async () => {
      tablePagination.value = props.pagination
    if (props.immediate !== false) {
        await fetchDataSource()
      }
      hasFetched.value = true
    })

    onActivated(() => {
      if (!hasFetched.value) {
        return
      }
      void fetchDataSource()
    })

    expose<QueryTableExpose<TEntity, TId>>({
      fetchDataSource,
      exportData,
      actionContext,
    })

    return () => {
      const hashedClass = classNames(
        prefixCls.value,
        hashId.value,
        cssVarCls.value,
        props.rootClass,
        attrs.class,
      )

      const renderTitle = () => (
        <Flex
          justify="space-between"
          align="center"
          class={classNames(hashId.value, `${prefixCls.value}-title`)}
        >
          {slots.title ? (
            slots.title()
          ) : (
            <Space>
              {renderIconFont(resolvedTitle.value.icon, 'align')}
              <Typography.Title level={5}>{resolvedTitle.value.title}</Typography.Title>
            </Space>
          )}
          <ActionButton actions={titleActions.value} />
        </Flex>
      )

      type FilterDropdownArgs = {
        column: TableColumn
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
                  v-slots={{icon: () => renderIconFont('loncra-search-check')}}
                >
                  <span>{locale.value.search}</span>
                </Button>
                <Button
                  block
                  onClick={() => resetField(column, setSelectedKeys, confirm)}
                  v-slots={{icon: () => renderIconFont('loncra-timer-reset')}}
                >
                  <span>{locale.value.reset}</span>
                </Button>
                <Button
                  block
                  onClick={() => clear(confirm, setSelectedKeys)}
                  v-slots={{icon: () => renderIconFont('loncra-archive-x')}}
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
        <DataTable
          {...(tablePassthroughAttrs.value as Record<string, unknown>)}
          class={hashedClass}
          style={attrs.style}
          columns={tableColumns.value}
          pagination={tablePagination.value}
          rowKey={SYSTEM_CONSTANT.ID_NAME}
          dataSource={dataSource.value}
          rowSelection={mergedRowSelection.value}
          loading={loading.value}
          bordered={props.bordered}
          onRow={tableOnRow.value}
          onChange={onChange}
          v-slots={{
            title: props.hideTitle ? undefined : renderTitle,
            bodyCell: ({
              text,
              record,
              index,
              column,
            }: {
              text: unknown
              record: TEntity
              index: number
              column: TableColumn
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
              return slots.bodyCell?.({
                text,
                record,
                index,
                column: column as SearchableColumnType<TEntity>,
              })
            },
            filterIcon: ({filtered}: {filtered: boolean}) =>
              renderIconFont(
                'loncra-search',
                classNames(filtered && `${prefixCls.value}-filter-icon-active`),
              ),
            filterDropdown: renderFilterDropdown,
            expandedRowRender: slots.expandedRowRender
              ? (args: {record: TEntity; index: number; indent: number; expanded: boolean}) =>
                  slots.expandedRowRender?.(args)
              : undefined,
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

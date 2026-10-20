import {
  computed,
  ref,
  type Ref,
  type SetupContext,
  type SlotsType,
  toRef,
  useModel,
  watch,
} from 'vue'
import type {TableProps} from 'antdv-next'
import {useConfig} from 'antdv-next/dist/config-provider/context'
import {classNames} from '@loncra/antdv'
import type {FilterRequest, PageRequest} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {BasicCrudQueryExpose, PageDictionaries} from '../basic-crud-query'
import {patchQuery, type DefaultCrudEntity} from '../_util/crud/useCollectionData'
import {useMergeRowSelection} from '../_util/crud/useMergeRowSelection'
import {isDragEnabled} from '../_util/crud/useDrag'
import {useTableRowDrag} from '../_util/crud/useTableRowDrag'
import {useLocale} from '../_util/useLocale'
import useStyle from './style'
import type {
  QueryTableEmits,
  QueryTableProps,
  QueryTableSlots,
  SearchableColumnType,
} from './types'

type TEntity = DefaultCrudEntity
type TId = string | number

function toTableFieldName(key: string): string {
  const [head = '', ...rest] = key.split('.')
  return [head.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(), ...rest].join('.')
}

export function useQueryTable(
  props: QueryTableProps<TId, TEntity, TEntity>,
  {attrs, emit}: Pick<
    SetupContext<QueryTableEmits<TEntity, TId>, SlotsType<QueryTableSlots<TEntity>>>,
    'attrs' | 'emit'
  >,
) {
  const locale = useLocale('Crud')
  const config = useConfig()
  const prefixCls = computed(() =>
    config.value.getPrefixCls('query-table', props.prefixCls ?? 'loncra-query-table'),
  )
  const [hashId, cssVarCls] = useStyle(prefixCls)
  const basic = ref<BasicCrudQueryExpose<TEntity, TId>>()

  const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
  const loading = useModel(props, 'loading') as unknown as Ref<boolean>
  const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
  const selectedRows = useModel(props, 'selectedRows') as unknown as Ref<TEntity[]>
  const tablePagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
  const buckets = useModel(props, 'buckets') as unknown as Ref<EnumBucketsResponseBody>
  const dictionaries = useModel(props, 'dictionaries') as unknown as Ref<PageDictionaries>
  const tableColumns = ref<SearchableColumnType<TEntity>[]>([])
  const appliedDefaultValueKeys = new Set<string>()

  const rootClass = computed(() =>
    classNames(prefixCls.value, hashId.value, cssVarCls.value, props.rootClass, attrs.class),
  )

  const ghostClass = computed(() =>
    classNames(prefixCls.value, hashId.value, cssVarCls.value, `${prefixCls.value}-drag-ghost`),
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
    idKey: (typeof props.rowKey === 'string' ? props.rowKey : undefined) as
      | (keyof TEntity & string)
      | undefined,
    dataSource,
    onRow: toRef(props, 'onRow'),
    ghostClass,
    dropClassPrefix,
    onFlatDrop: ({sorts, target, fromIndex, toIndex}) =>
      emit('drop', sorts, target, fromIndex, toIndex),
    onTreeDrop: ({sorts, drag, target, dropPosition, tree}) =>
      emit('treeDrop', sorts, drag, target, {dropPosition, tree}),
  })

  const hasActionsColumn = computed(() => basic.value?.hasRecordActions ?? false)

  const externalRowSelection = computed((): TableProps['rowSelection'] | false | null => {
    const raw = (props.rowSelection ?? attrs.rowSelection) as
      | TableProps['rowSelection']
      | false
      | undefined
    if (raw === false) {
      return null
    }
    if (raw === undefined && !(basic.value?.needsBulkSelection ?? false)) {
      return null
    }
    return raw ?? {fixed: true, type: 'checkbox' as const}
  })

  const {rowSelection: mergedRowSelection} = useMergeRowSelection<TEntity, TId>(
    externalRowSelection,
    selectedRows,
    props.rowKey,
  )

  const tablePassthroughAttrs = computed(() => {
    const {
      class: _class,
      style: _style,
      rowSelection: _rowSelection,
      classes: _classes,
      styles: _styles,
      ...rest
    } = attrs
    if (rest.scroll === undefined) {
      const cols: {width?: string | number}[] = tableColumns.value
      const allSized = cols.length > 0 && cols.every((column) => column.width != null)
      rest.scroll = {
        x: allSized ? cols.reduce((sum, column) => sum + Number(column.width), 0) : 'max-content',
      }
    }
    return rest
  })

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
      patchQuery(query, {[column.search.queryName]: ''})
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
        optionsCol.search.queryName = `filter_[${toTableFieldName(String(col.key))}_${optionsCol.search.expression || 'eq'}]`
      }
      const queryName = optionsCol.search.queryName
      if (
        optionsCol.search.defaultValue !== undefined &&
        !appliedDefaultValueKeys.has(queryName)
      ) {
        appliedDefaultValueKeys.add(queryName)
        patchQuery(query, {[queryName]: optionsCol.search.defaultValue})
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

  return {
    locale,
    prefixCls,
    hashId,
    cssVarCls,
    rootClass,
    basic,
    dataSource,
    loading,
    query,
    selectedRows,
    tablePagination,
    buckets,
    dictionaries,
    tableColumns,
    mergedRowSelection,
    tablePassthroughAttrs,
    tableOnRow,
    isDragCell,
    onDragHandleStart,
    onDragHandleEnd,
    doSearch,
    clear,
    resetField,
    onFilterEnterKey,
  }
}

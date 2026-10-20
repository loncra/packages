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
import {classNames, splitSemantic} from '@loncra/antdv'
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

const SEMANTIC_PARTS = ['card', 'table'] as const

/**
 * 列的 `key` → 后端 `filter_[]` 要的**表字段名**：只把**第一段**做 camelCase → snake_case。
 *
 * 两边的命名规则不同，必须映射：
 * - 列 `key` = **实体字段名**（`readPath` 按它取值、`renderCell` 按它匹配声明）⇒ 不能改；
 * - 后端 `filter_[<字段>_<wildcard>]` 的顶层字段 = **表字段名**（名字原样进 MyBatis-Plus 的
 *   `QueryWrapper`，没有驼峰归一化；后端自己的 filter 也都是 `phone_number_nen` 这种写法）
 *   ⇒ 多词字段必须写成 `auth_mode` / `real_name`。
 *
 * 点后面的路径段**不转**：后端嵌套段走的是实体 / JSON 属性（如 `attachment_list.bucketName`），
 * 本来就是 camelCase。已经有显式 `queryName` 的列不走这里。
 */
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
  /** 基类实例：取数 / 分页 / 标题 / 动作都在它那儿 */
  const basic = ref<BasicCrudQueryExpose<TEntity, TId>>()

  // 双向绑定：父级 v-model 时纯受控（写操作 emit 回流），未绑时写本地值并 emit。
  // localValue 与 props 保持同一引用，父级「改对象属性」也能立即生效（不再需要 watch 拷贝）。
  const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
  const loading = useModel(props, 'loading') as unknown as Ref<boolean>
  const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
  const selectedRows = useModel(props, 'selectedRows') as unknown as Ref<TEntity[]>
  const tablePagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>
  const buckets = useModel(props, 'buckets') as unknown as Ref<EnumBucketsResponseBody>
  const dictionaries = useModel(props, 'dictionaries') as unknown as Ref<PageDictionaries>
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

  /**
   * "操作"列要不要补：基类已经算过 `recordActions === false` 与权限，表格只负责画。
   * `hasRecordActions` 是**值**（expose 出来的 ref 会被 Vue 解包）⇒ 不许再写 `.value`；
   * `?? false` 兜的是"基类还没挂载"（`basic.value` 为 undefined）那一瞬间。
   */
  const hasActionsColumn = computed(() => basic.value?.hasRecordActions ?? false)

  const externalRowSelection = computed((): TableProps['rowSelection'] | false | null => {
    const raw = (props.rowSelection ?? attrs.rowSelection) as
      | TableProps['rowSelection']
      | false
      | undefined
    if (raw === false) {
      return null
    }
    // 没有批量动作（基类看的）就不自动开多选（同样是值，不是 ref）
    if (raw === undefined && !(basic.value?.needsBulkSelection ?? false)) {
      return null
    }
    return raw ?? {fixed: true, type: 'checkbox' as const}
  })

  // 选择态合并与卡片网格共用同一套取主键规则（`resolveRowKey`，字段名 / 函数形态都认）
  const {rowSelection: mergedRowSelection} = useMergeRowSelection<TEntity, TId>(
    externalRowSelection,
    selectedRows,
    props.rowKey,
  )

  /** 语义样式按部件拆（键前缀见 `SEMANTIC_PARTS`）：卡片的给基类、表格的给 `<DataTable>` */
  const classSemantic = computed(() =>
    splitSemantic(attrs.classes as Record<string, string> | undefined, SEMANTIC_PARTS, 'card'),
  )
  const styleSemantic = computed(() =>
    splitSemantic(attrs.styles as Record<string, unknown> | undefined, SEMANTIC_PARTS, 'card'),
  )

  const tablePassthroughAttrs = computed(() => {
    // `classes` / `styles` 已在上面按部件分流；其余未知 attrs 照旧落表格
    const {
      class: _class,
      style: _style,
      rowSelection: _rowSelection,
      classes: _classes,
      styles: _styles,
      ...rest
    } = attrs
    if (rest.scroll === undefined) {
      // 显式收窄成"只关心 width"：在 antd 那层泛型列类型上做 `.every` 会触发 TS2589（类型递归预算）
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
    classSemantic,
    styleSemantic,
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

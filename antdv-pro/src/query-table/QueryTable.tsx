import {defineComponent, h, type PropType, type SlotsType} from 'vue'
import type {TableProps} from 'antdv-next'
import {Button, Space, SpaceCompact, Table, Typography} from 'antdv-next'
import {DeleteOutlined, FilterOutlined, SearchOutlined, UndoOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import BasicCrudQuery, {type BasicCrudQueryContentProps} from '../basic-crud-query'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {
  BasicCrudQueryExpose,
  PageDictionaries,
  RefreshOnActivate,
} from '../basic-crud-query'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
  patchQuery,
} from '../_util/crud/useCollectionData'
import ActionButton from '../action-button'
import {useQueryTable} from './useQueryTable'
import type {
  QueryTableConstructor,
  QueryTableEmits,
  QueryTableProps,
  QueryTableSlots,
  SearchableColumnType,
} from './types'

const QUERY_TABLE_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedRows',
  'update:pagination',
  'update:buckets',
  'update:dictionaries',
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
 * `v-model` 交给它，并把它 expose 的能力转发出去）。
 *
 * 外观：`classes` / `styles` 只留**一个**入口，键用「部件.语义路径」——
 * `table.xxx` 是这张表格（antd Table 的语义键），不带前缀的算卡片本体（plan 的 `Card`），
 * 拆法见 `@loncra/antdv` 的 `splitSemantic`。
 */
const QueryTable = defineComponent({
  name: 'LQueryTable',
  inheritAttrs: false,
  props: {
    // ── 交给基类的（外壳层） ──
    service: {type: Object as PropType<QueryTableProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    /**
     * 卡片头，与 `DataLoadingCard` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题。
     *
     * ⚠️ **`default: undefined` 不能删**：类型里带了 `Boolean`，父级"不传"时 Vue 的布尔转换会把它
     * 变成 `false`（= "不要卡片头"）⇒ 默认标题与工具栏都没了。
     */
    title: {type: [Object, Boolean] as PropType<QueryTableProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    /** 内嵌形态：不要卡片壳、不要外层 `Spin`，标题落到表格自带标题（透传给基类） */
    plain: {type: Boolean, default: false},
    /** 自定义取数：给了就不再走 `service.find`（透传给基类，见 `CollectionFetch`） */
    fetch: {type: Function as PropType<QueryTableProps['fetch']>, default: undefined},
    /**
     * 标题右侧的工具栏动作：数组 = 与默认 `add`/`deleteSelected` 合并；`false` = 整排不出。
     *
     * ⚠️ **`default: undefined` 不能删**（与 `title` 同一个坑）：类型里带 `Boolean` 时"不传"会被
     * Vue 转成 `false`，那语义就成了"整排按钮都不出"。
     */
    toolbarActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['toolbarActions']>,
      default: undefined,
    },
    /**
     * 行内动作：数组 = 与默认 `edit`/`detail`/`delete` 合并；`false` = 不要（`操作`列也不补）。
     *
     * ⚠️ **`default: undefined` 不能删**：不传被转成 `false` 时，基类 `hasRecordActions` 直接判"没有
     * 行内动作" ⇒ **"操作"列整列不补**（`BasicCrudQuery.tsx:284`）。
     */
    recordActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['recordActions']>,
      default: undefined,
    },
    /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dictionaryCodes`）—— 原样交给基类 */
    enums: Array as PropType<QueryTableProps['enums']>,
    dictionaryCodes: Array as PropType<QueryTableProps['dictionaryCodes']>,
    prefixCls: String,
    rootClass: String,
    // ── 表格自己的 ──
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    bordered: {type: Boolean, default: true},
    /** 拖拽开关 + 幽灵内容：`true` = 可拖（幽灵缺省主键）；`(record) => 内容` = 可拖且它就是幽灵 */
    drag: [Boolean, Function] as PropType<QueryTableProps['drag']>,
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
      default: () => ({...DEFAULT_COLLECTION_PAGINATION}),
    },
    /** 字典加载结果（基类拉完 `v-model` 回来） */
    buckets: {type: Object as PropType<QueryTableProps['buckets']>, default: () => ({})},
    dictionaries: {type: Object as PropType<QueryTableProps['dictionaries']>, default: () => ({})},
  },
  emits: [...QUERY_TABLE_EMITS],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity

    const {
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
    } = useQueryTable(props, {attrs, emit})

    expose<CollectionExpose<TEntity>>({
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

      /**
       * `plain` 时表格**自带标题**（`.ant-table-title`）：一行 flex —— 左标题、右工具栏。
       * 标题必须挂在表格自己身上才会跟表格**同进同退**（antd 对嵌套表会整体偏移
       * `.ant-table-wrapper:only-child .ant-table`；标题若留在卡片头就与表格错位）。两项都没有就不出。
       */
      const tableTitle = (content?: BasicCrudQueryContentProps) =>
        !content || (content.title == null && content.extra == null)
          ? undefined
          : () => (
              <div
                class={classNames(
                  prefixCls.value,
                  hashId.value,
                  cssVarCls.value,
                  `${prefixCls.value}-table-title`,
                )}
              >
                <div>{content.title}</div>
                {content.extra ? <div>{content.extra}</div> : null}
              </div>
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
                  patchQuery(query, {[queryName]: value})
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
          enums={props.enums}
          dictionaryCodes={props.dictionaryCodes}
          selectedKey="selectedRows"
          prefixCls={props.prefixCls}
          plain={props.plain}
          fetch={props.fetch}
          {...({
            classes: {card: classSemantic.value.card},
            styles: {card: styleSemantic.value.card},
          } as Record<string, unknown>)}
          dataSource={dataSource.value}
          loading={loading.value}
          query={query.value}
          selectedRows={selectedRows.value}
          pagination={tablePagination.value}
          buckets={buckets.value}
          dictionaries={dictionaries.value}
          onUpdate:dataSource={(value: TEntity[]) => (dataSource.value = value)}
          onUpdate:loading={(value: boolean) => (loading.value = value)}
          onUpdate:query={(value: FilterRequest | PageRequest) => (query.value = value)}
          onUpdate:selectedRows={(value: TEntity[]) => (selectedRows.value = value)}
          onUpdate:pagination={(value: unknown) => (tablePagination.value = value as TableProps['pagination'])}
          onUpdate:buckets={(value: EnumBucketsResponseBody) => (buckets.value = value)}
          onUpdate:dictionaries={(value: PageDictionaries) => (dictionaries.value = value)}
          onAction={(payload) => emit('action', payload)}
          onAdd={() => emit('add')}
          onEdit={(record: TEntity) => emit('edit', record)}
          onDetail={(record: TEntity) => emit('detail', record)}
          onDeleted={(records: TEntity[]) => emit('deleted', records)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            // `plain` 时基类把「标题 / 工具栏」交进来 ⇒ 落到表格自带标题上
            default: (content: BasicCrudQueryContentProps) => (
              <DataTable
                {...(tablePassthroughAttrs.value as Record<string, unknown>)}
                title={tableTitle(content)}
                class={hashedClass}
                style={attrs.style}
                classes={classSemantic.value.table}
                styles={styleSemantic.value.table}
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
  CollectionExpose,
  QueryTableConstructor,
  QueryTableEmits,
  QueryTableProps,
  QueryTableSlots,
}

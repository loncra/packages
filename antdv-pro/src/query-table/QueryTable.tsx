import {defineComponent, h, type PropType, type SlotsType} from 'vue'
import type {TableProps} from 'antdv-next'
import {Table} from 'antdv-next'
import {FilterOutlined} from '@antdv-next/icons'
import {classNames} from '@loncra/antdv'
import {type FilterRequest, type PageRequest, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import BasicCrudQuery, {type BasicCrudQueryContentProps} from '../basic-crud-query'
import type {AuthorityProps} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {BasicCrudQueryExpose, PageDictionaries, RefreshOnActivate} from '../basic-crud-query'
import {
  DEFAULT_COLLECTION_PAGINATION,
  type DefaultCrudEntity,
  patchQuery,
} from '../_util/crud/useCollectionData'
import QueryTableCell from './cell/QueryTableCell'
import QueryTableFilterDropdown from './filter/QueryTableFilterDropdown'
import QueryTableTitle from './title/QueryTableTitle'
import {useQueryTable} from './useQueryTable'
import type {
  QueryTableConstructor,
  QueryTableProps,
  QueryTableSlots,
  SearchableColumnType,
} from './types'

type FilterDropdownArgs = {
  column: SearchableColumnType<DefaultCrudEntity>
  setSelectedKeys: (keys: string[]) => void
  confirm: () => void
}

const QueryTable = defineComponent({
  name: 'LQueryTable',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<QueryTableProps['service']>, required: true},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    title: {type: [Object, Boolean] as PropType<QueryTableProps['title']>, default: undefined},
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    plain: {type: Boolean, default: false},
    fetch: {type: Function as PropType<QueryTableProps['fetch']>, default: undefined},
    toolbarActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['toolbarActions']>,
      default: undefined,
    },
    recordActions: {
      type: [Array, Boolean] as PropType<QueryTableProps['recordActions']>,
      default: undefined,
    },
    enums: Array as PropType<QueryTableProps['enums']>,
    dictionaryCodes: Array as PropType<QueryTableProps['dictionaryCodes']>,
    prefixCls: String,
    rootClass: String,
    classes: Object as PropType<QueryTableProps['classes']>,
    styles: Object as PropType<QueryTableProps['styles']>,
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    bordered: {type: Boolean, default: true},
    drag: [Boolean, Function] as PropType<QueryTableProps['drag']>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowKey: {
      type: [String, Function] as PropType<TableProps['rowKey']>,
      default: SYSTEM_CONSTANT.ID_NAME,
    },
    rowSelection: [Object, Boolean] as PropType<TableProps['rowSelection'] | false>,
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
    buckets: {type: Object as PropType<QueryTableProps['buckets']>, default: () => ({})},
    dictionaries: {type: Object as PropType<QueryTableProps['dictionaries']>, default: () => ({})},
  },
  emits: [
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
  ],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    const {
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
      tableLoading,
      tableOnRow,
      isDragCell,
      onDragHandleStart,
      onDragHandleEnd,
      doSearch,
      clear,
      resetField,
      onFilterEnterKey,
    } = useQueryTable(props, {attrs, emit})

    expose<
      CollectionExpose<DefaultCrudEntity> &
        Pick<BasicCrudQueryExpose<DefaultCrudEntity>, 'hasRecordActions' | 'needsBulkSelection'>
    >({
      fetchDataSource: async () => basic.value?.fetchDataSource(),
      remove: (records) => basic.value?.remove(records),
      get hasRecordActions() {
        return basic.value?.hasRecordActions ?? false
      },
      get needsBulkSelection() {
        return basic.value?.needsBulkSelection ?? false
      },
    })

    return () => {
      const tableTitle = (content?: BasicCrudQueryContentProps) => {
        if (!content || (content.title == null && content.extra == null)) {
          return undefined
        }
        return () => (
          <QueryTableTitle
            prefixCls={prefixCls.value}
            hashId={hashId.value}
            cssVarCls={cssVarCls.value}
            title={content.title}
            extra={content.extra}
          />
        )
      }

      const renderFilterDropdown = ({column, setSelectedKeys, confirm}: FilterDropdownArgs) => {
        const search = column.search
        if (!search?.component) {
          return null
        }
        const queryName = search.queryName ?? ''
        return (
          <QueryTableFilterDropdown
            prefixCls={prefixCls.value}
            hashId={hashId.value}
            cssVarCls={cssVarCls.value}
            search={search}
            query={query.value}
            locale={locale.value}
            onUpdateValue={(value) => patchQuery(query, {[queryName]: value})}
            onSearch={() => doSearch(column, setSelectedKeys, confirm)}
            onReset={() => resetField(column, setSelectedKeys, confirm)}
            onClear={() => clear(confirm, setSelectedKeys)}
            onEnter={(e: KeyboardEvent) => onFilterEnterKey(e, column, setSelectedKeys, confirm)}
          />
        )
      }

      const DataTable = Table
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
          class={rootClass.value}
          style={attrs.style}
          classes={{
            card: props.classes?.card,
            spin: props.classes?.spin,
            pagination: props.classes?.pagination,
          }}
          styles={{
            card: props.styles?.card,
            spin: props.styles?.spin,
            pagination: props.styles?.pagination,
          }}
          dataSource={dataSource.value}
          loading={loading.value}
          query={query.value}
          selectedRows={selectedRows.value}
          pagination={tablePagination.value}
          buckets={buckets.value}
          dictionaries={dictionaries.value}
          onUpdate:dataSource={(value: DefaultCrudEntity[]) => (dataSource.value = value)}
          onUpdate:loading={(value: boolean) => (loading.value = value)}
          onUpdate:query={(value: FilterRequest | PageRequest) => (query.value = value)}
          onUpdate:selectedRows={(value: DefaultCrudEntity[]) => (selectedRows.value = value)}
          onUpdate:pagination={(value: unknown) => (tablePagination.value = value as TableProps['pagination'])}
          onUpdate:buckets={(value: EnumBucketsResponseBody) => (buckets.value = value)}
          onUpdate:dictionaries={(value: PageDictionaries) => (dictionaries.value = value)}
          onAction={(payload) => emit('action', payload)}
          onAdd={() => emit('add')}
          onEdit={(record: DefaultCrudEntity) => emit('edit', record)}
          onDetail={(record: DefaultCrudEntity) => emit('detail', record)}
          onDeleted={(records: DefaultCrudEntity[]) => emit('deleted', records)}
          v-slots={{
            title: slots.title ? () => slots.title?.() : undefined,
            extra: slots.extra ? () => slots.extra?.() : undefined,
            default: (content: BasicCrudQueryContentProps) => (
              <DataTable
                {...(tablePassthroughAttrs.value as Record<string, unknown>)}
                title={tableTitle(content)}
                classes={props.classes?.table}
                styles={props.styles?.table}
                columns={tableColumns.value}
                pagination={false}
                rowKey={props.rowKey}
                dataSource={dataSource.value}
                rowSelection={mergedRowSelection.value}
                loading={tableLoading.value}
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
                    record: DefaultCrudEntity
                    index: number
                    column: SearchableColumnType<DefaultCrudEntity>
                  }) => {
                    const actionable = column.dataIndex === 'action'
                    return (
                      <QueryTableCell
                        prefixCls={prefixCls.value}
                        hashId={hashId.value}
                        cssVarCls={cssVarCls.value}
                        isDrag={isDragCell(column)}
                        actionable={actionable}
                        actions={actionable ? (basic.value?.resolveRecordActions(record) ?? []) : []}
                        onAction={(id: string) => basic.value?.onRecordAction(id, record)}
                        onDragStart={(e: DragEvent) => onDragHandleStart(record, e)}
                        onDragEnd={onDragHandleEnd}
                        v-slots={{
                          default: () => slots.bodyCell?.({text, record, index, column}),
                        }}
                      />
                    )
                  },
                  filterIcon: ({filtered}: {filtered: boolean}) =>
                    h(FilterOutlined, {
                      class: classNames(
                        prefixCls.value,
                        hashId.value,
                        cssVarCls.value,
                        filtered && `${prefixCls.value}-filter-icon-active`,
                      ),
                    }),
                  filterDropdown: renderFilterDropdown,
                  expandedRowRender: slots.expandedRowRender
                    ? (args: {record: DefaultCrudEntity; index: number; indent: number; expanded: boolean}) =>
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

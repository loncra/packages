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
import type {BasicCrudQueryExpose, PageDictionaries, RefreshOnActivate} from '../basic-crud-query'
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
  emits: [...QUERY_TABLE_EMITS],
  slots: Object as SlotsType<QueryTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity

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
      CollectionExpose<TEntity> &
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
      }

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
              prefixCls.value,
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
                          class={classNames(
                            prefixCls.value,
                            hashId.value,
                            cssVarCls.value,
                            `${prefixCls.value}-drag-handle`,
                          )}
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
                      class: classNames(
                        prefixCls.value,
                        hashId.value,
                        cssVarCls.value,
                        filtered && `${prefixCls.value}-filter-icon-active`,
                      ),
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

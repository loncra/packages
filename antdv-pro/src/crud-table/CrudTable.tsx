import {computed, defineComponent, type PropType, type Ref, ref, type SlotsType, toRef, unref, useModel, watch,} from 'vue'
import type {TableProps} from 'antdv-next'
import {App} from 'antdv-next'
import {type FilterRequest, type PageRequest} from '@loncra/client/commons'
import {useLocale} from '../_util/useLocale'
import {useActionAuth} from '../crud-config-provider'
import {
  type ActionContext,
  type ActionDefinition,
  type ActionPayload,
  buildItemActionContext,
  BUILTIN_ITEM_ACTION_IDS,
  mergeDefinitions,
  useActionResolver,
} from '../_util/crud/actions'
import {createDefaultBulkActions, createDefaultItemActions} from '../_util/crud/defaultActions'
import {useCrudDelete} from '../_util/crud/useCrudDelete'
import QueryTable from '../query-table/QueryTable'
import ActionButton from '../action-button'
import type {AuthorityProps, DefaultCrudEntity, QueryTableExpose, RefreshOnActivate, SearchableColumnType,} from '../query-table/types'
import type {
  CrudTableConstructor,
  CrudTableEmits,
  CrudTableExpose,
  CrudTableProps,
  CrudTableRuntimeProps,
  CrudTableSlots,
} from './types'

const CRUD_TABLE_EMITS = [
  'update:dataSource',
  'update:loading',
  'update:query',
  'update:selectedRows',
  'update:pagination',
  'action',
  'add',
  'edit',
  'detail',
  'exported',
  'drop',
  'treeDrop',
] as const

const CrudTable = defineComponent({
  name: 'LCrudTable',
  inheritAttrs: false,
  props: {
    service: {type: Object as PropType<CrudTableRuntimeProps['service']>, required: true},
    columns: {type: Array as PropType<SearchableColumnType<DefaultCrudEntity>[]>, default: () => []},
    immediate: {type: Boolean, default: true},
    refreshOnActivate: {
      type: [Boolean, Function] as PropType<RefreshOnActivate>,
      default: true,
    },
    hideTitle: {type: Boolean, default: false},
    bordered: {type: Boolean, default: true},
    title: String,
    titleIcon: String,
    hasPermission: Function as PropType<(permission: string) => boolean>,
    authority: Object as PropType<AuthorityProps>,
    actions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    rowActions: Array as PropType<ActionDefinition<DefaultCrudEntity>[]>,
    recordActions: {type: Boolean, default: true},
    actionContextExtras: Object as PropType<Record<string, unknown>>,
    drag: Boolean,
    formatDragPreview: Function as PropType<(record: DefaultCrudEntity) => string>,
    onRow: Function as PropType<TableProps['onRow']>,
    rowKey: [String, Function] as PropType<TableProps['rowKey']>,
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
  emits: [...CRUD_TABLE_EMITS],
  slots: Object as SlotsType<CrudTableSlots<DefaultCrudEntity>>,
  setup(props, {attrs, emit, expose, slots}) {
    type TEntity = DefaultCrudEntity
    type TBody = DefaultCrudEntity
    type TId = string | number
    const {message, modal} = App.useApp()
    const locale = useLocale('Crud')
    const auth = useActionAuth(toRef(props, 'hasPermission'))
    const {resolveActions} = useActionResolver()
    const queryTable = ref<QueryTableExpose<TEntity, TId>>()

    // 双向绑定：透传给 QueryTable 时同时传值与 onUpdate，由最远端统一持有状态
    const loading = useModel(props, 'loading') as unknown as Ref<boolean>
    const selectedRows = useModel(props, 'selectedRows') as unknown as Ref<TEntity[]>
    const dataSource = useModel(props, 'dataSource') as unknown as Ref<TEntity[]>
    const query = useModel(props, 'query') as unknown as Ref<FilterRequest | PageRequest>
    const pagination = useModel(props, 'pagination') as unknown as Ref<TableProps['pagination']>

    const {remove} = useCrudDelete<TBody, TEntity, TId>({
      service: props.service,
      locale: () => locale.value,
      modal,
      message,
      loading,
      refresh: () => queryTable.value?.fetchDataSource(),
    })

    const tableActions = computed(() =>
      mergeDefinitions(
        createDefaultBulkActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove,
        }),
        props.actions ?? [],
      ),
    )

    const rowActionDefinitions = computed(() =>
      mergeDefinitions(
        createDefaultItemActions<TBody, TEntity, TId>({
          authority: props.authority,
          service: props.service,
          locale: locale.value,
          remove,
          onEdit: (record) => emit('edit', record),
          onDetail: (record) => emit('detail', record),
        }),
        props.rowActions ?? [],
      ),
    )

    const displayColumns = computed<SearchableColumnType<TEntity>[]>(() => {
      const cols = [...(props.columns ?? [])]
      if (props.recordActions && rowActionDefinitions.value.some((def) => auth.can(def.permission))) {
        cols.push({
          title: locale.value.action,
          dataIndex: 'action',
          key: 'action',
          align: 'center',
          width: 80,
          fixed: 'right',
        })
      }
      return cols
    })

    function buildRowContext(record: TEntity): ActionContext<TEntity> {
      return buildItemActionContext({
        record,
        toolbarContext: unref(queryTable.value?.actionContext),
        actionContextExtras: props.actionContextExtras,
      })
    }

    function resolveRowActions(record: TEntity) {
      return resolveActions(rowActionDefinitions.value, buildRowContext(record), auth)
    }

    function onRowAction(id: string, record: TEntity) {
      if (BUILTIN_ITEM_ACTION_IDS.includes(id as (typeof BUILTIN_ITEM_ACTION_IDS)[number])) {
        return
      }
      emit('action', {id, context: buildRowContext(record)})
    }

    function onTableAction(payload: ActionPayload<TEntity>) {
      if (payload.id === 'add') {
        emit('add')
      }
      emit('action', payload)
    }

    expose<CrudTableExpose<TEntity>>({
      fetchDataSource: () => queryTable.value?.fetchDataSource() ?? Promise.resolve(),
      exportData: () => queryTable.value?.exportData(selectedRows.value) ?? Promise.resolve(),
      remove,
    })

    return () => (
      <QueryTable
        ref={queryTable}
        {...attrs}
        service={props.service}
        columns={displayColumns.value}
        actions={tableActions.value}
        actionContextExtras={props.actionContextExtras}
        hideTitle={props.hideTitle}
        bordered={props.bordered}
        title={props.title}
        titleIcon={props.titleIcon}
        hasPermission={props.hasPermission}
        drag={props.drag}
        formatDragPreview={props.formatDragPreview}
        onRow={props.onRow}
        rowKey={props.rowKey}
        authority={props.authority}
        pagination={pagination.value}
        immediate={props.immediate}
        refreshOnActivate={props.refreshOnActivate}
        rowSelection={props.rowSelection}
        prefixCls={props.prefixCls}
        rootClass={props.rootClass}
        dataSource={dataSource.value}
        loading={loading.value}
        query={query.value}
        selectedRows={selectedRows.value}
        onUpdate:dataSource={(value) => {
          dataSource.value = value
        }}
        onUpdate:loading={(value) => {
          loading.value = value
        }}
        onUpdate:query={(value) => {
          query.value = value
        }}
        onUpdate:selectedRows={(value) => {
          selectedRows.value = value
        }}
        onUpdate:pagination={(value) => {
          pagination.value = value
        }}
        onAction={onTableAction}
        onExported={(result) => emit('exported', result)}
        onDrop={(sorts, target, fromIndex, toIndex) => emit('drop', sorts, target, fromIndex, toIndex)}
        onTreeDrop={(sorts, drag, target, payload) => emit('treeDrop', sorts, drag, target, payload)}
        v-slots={{
          title: slots.title ? () => slots.title?.() : undefined,
          expandedRowRender: slots.expandedRowRender
            ? (args: {record: TEntity; index: number; indent: number; expanded: boolean}) =>
                slots.expandedRowRender?.(args)
            : undefined,
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
            if (column.dataIndex === 'action') {
              return (
                <>
                  {slots.bodyCell?.({text, record, index, column})}
                  <ActionButton
                    size="small"
                    actions={resolveRowActions(record)}
                    onAction={(id: string) => onRowAction(id, record)}
                  />
                </>
              )
            }
            return slots.bodyCell?.({text, record, index, column})
          },
        }}
      />
    )
  },
}) as unknown as CrudTableConstructor

export default CrudTable
export type {CrudTableConstructor, CrudTableEmits, CrudTableExpose, CrudTableProps}

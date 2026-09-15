import type {EmitsToProps, PublicProps} from 'vue'
import type {TableProps} from 'antdv-next'
import type {
  BasicIdMetadata,
  DropPosition,
  FilterRequest,
  PageRequest,
  RestResult,
  ScrollPageResult,
  SYSTEM_CONSTANT,
  TreeSortMetadata,
} from '@loncra/client/commons'
import type {ActionDefinition, ActionPayload} from '../_util/crud/actions'
import type {DefaultCrudEntity, QueryTableEmits, QueryTableProps, QueryTableSlots,} from '../query-table/types'

export interface CrudTableProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryTableProps<TBody, TEntity, TPage, TId> {
  recordActions?: boolean
  rowActions?: ActionDefinition<TEntity>[]
}

export type CrudTableEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = QueryTableEmits<TEntity, TId> & {
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
}

export interface CrudTableExpose<TEntity extends BasicIdMetadata<unknown>> {
  fetchDataSource: () => Promise<void | undefined>
  exportData: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}

export interface CrudTableSlots<TEntity extends object> extends QueryTableSlots<TEntity> {}

export type CrudTableRuntimeProps = CrudTableProps<
  DefaultCrudEntity,
  DefaultCrudEntity,
  ScrollPageResult<DefaultCrudEntity>,
  string | number
>

export type CrudTableConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudTableProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<CrudTableEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: CrudTableProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<CrudTableEmits<TEntity, TId>> &
    PublicProps
  $slots: CrudTableSlots<TEntity>
} & CrudTableExpose<TEntity>

export type {ActionPayload, DropPosition, FilterRequest, PageRequest, RestResult, TableProps, TreeSortMetadata}

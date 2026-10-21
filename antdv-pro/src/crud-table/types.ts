import type {EmitsToProps, PublicProps} from 'vue'
import type {BasicIdMetadata, ScrollPageResult, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {QueryTableEmits, QueryTableProps, QueryTableSlots} from '../query-table/types'

export type CrudTableConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: QueryTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: QueryTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryTableEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryTableSlots<TEntity>
} & CollectionExpose<TEntity>

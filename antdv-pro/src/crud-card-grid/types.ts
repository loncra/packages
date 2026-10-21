import type {EmitsToProps, PublicProps} from 'vue'
import type {BasicIdMetadata, ScrollPageResult, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {QueryCardGridEmits, QueryCardGridProps, QueryCardGridSlots,} from '../query-card-grid/types'

export type CrudCardGridConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: QueryCardGridProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: QueryCardGridProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryCardGridSlots<TEntity>
} & CollectionExpose<TEntity>

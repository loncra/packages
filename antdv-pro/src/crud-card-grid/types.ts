import type {EmitsToProps, PublicProps} from 'vue'
import type {BasicIdMetadata, ScrollPageResult, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {
  QueryCardGridEmits,
  QueryCardGridProps,
  QueryCardGridSlots,
} from '../query-card-grid/types'

/**
 * 门面组件类型：props **就是内容层 `QueryCardGridProps`** —— 门面不自造名字，
 * 也没有自己的 `actions` / `itemActions` / 布尔开关。
 * 所以这里**没有** `CrudCardGridProps` 这个名字（曾经是个空接口，纯别名）。
 */
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

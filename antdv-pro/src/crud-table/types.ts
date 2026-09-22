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
import type {RecordActionPayload, ToolbarActionPayload} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {QueryTableEmits, QueryTableProps, QueryTableSlots} from '../query-table/types'

/**
 * 门面组件类型：props **就是内容层 `QueryTableProps`** —— 门面不自造名字
 * （`toolbarActions` / `recordActions` 原样透传；`recordActions: false` 就是"不要行内动作、
 * 连操作列也不补"），也没有自己的 `actions` / `rowActions` / 布尔开关。
 * 所以这里**没有** `CrudTableProps` 这个名字（曾经是个空接口，纯别名）。
 */
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

export type {
  DropPosition,
  FilterRequest,
  PageRequest,
  RecordActionPayload,
  RestResult,
  TableProps,
  ToolbarActionPayload,
  TreeSortMetadata,
}

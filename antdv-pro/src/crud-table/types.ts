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
import type {
  RecordActionDefinition,
  RecordActionPayload,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {EnumBucketRequest, PageDicts} from '../basic-crud-query/dictionaries'
import type {CollectionExpose} from '../query-table/types'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import type {
  QueryCollectionProps,
  QueryTableEmits,
  QueryTableSlots,
  SearchableColumnType,
} from '../query-table/types'

/**
 * 门面 props：对外契约与以前一样（宿主 22 处在用），内部只做两处映射 ——
 * `actions` → `toolbarActions`、`recordActions`(boolean)+`rowActions` → `recordActions`；
 * 标题直接用基类统一的 `title`（`VNode | false`，`hide-title` 等价于 `:title="false"`）。
 */
export interface CrudTableProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends QueryCollectionProps<TBody, TEntity, TPage, TId> {
  columns?: SearchableColumnType<TEntity>[]
  bordered?: boolean
  onRow?: TableProps['onRow']
  rowSelection?: TableProps['rowSelection'] | false
  pagination?: TableProps['pagination']
  selectedRows?: TEntity[]
  /** 旧的布尔开关：`false` = 不要行内动作（连"操作"列都不补） */
  recordActions?: boolean
  /** 行内动作（与默认 `edit`/`detail`/`delete` 合并） */
  rowActions?: RecordActionDefinition<TEntity>[]
  /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dicts`）—— 原样交给基类加载（枚举桶按模块分组） */
  enums?: EnumBucketRequest[]
  dictCodes?: (string | undefined)[]
  /** 字典加载结果（基类 `v-model` 回给建列的地方） */
  buckets?: EnumBucketsResponseBody
  dicts?: PageDicts
}

export type CrudTableEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = QueryTableEmits<TEntity, TId>

export interface CrudTableSlots<TEntity extends object> extends QueryTableSlots<TEntity> {}

export type CrudTableConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<CrudTableEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: CrudTableProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<CrudTableEmits<TEntity, TId>> &
    PublicProps
  $slots: CrudTableSlots<TEntity>
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

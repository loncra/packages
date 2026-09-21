import type {EmitsToProps, PublicProps} from 'vue'
import type {
  BasicIdMetadata,
  ScrollPageResult,
  SYSTEM_CONSTANT,
} from '@loncra/client/commons'
import type {
  RecordActionDefinition,
  ToolbarActionDefinition,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {
  QueryCardGridEmits,
  QueryCardGridProps,
  QueryCardGridSlots,
} from '../query-card-grid/types'

/**
 * 门面（旧入口）props：对外名不变，内部映射成内容层的名字
 * （`actions` → `toolbarActions`、`itemActions` + `recordActions`(boolean) → `recordActions`）。
 */
export interface CrudCardGridProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends Omit<QueryCardGridProps<TId, TBody, TEntity, TPage>, 'toolbarActions' | 'recordActions'> {
  /** 标题右侧的工具栏动作（旧名 → 内容层 `toolbarActions`；`false` = 整排不出） */
  actions?: ToolbarActionDefinition<TEntity>[] | false
  /** 项内动作定义（旧名 → 内容层 `recordActions`） */
  itemActions?: RecordActionDefinition<TEntity>[]
  /** 是否要项内动作（旧的是开关：`false` = 不要） */
  recordActions?: boolean
}

export type CrudCardGridConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudCardGridProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: CrudCardGridProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryCardGridSlots<TEntity>
} & CollectionExpose<TEntity>

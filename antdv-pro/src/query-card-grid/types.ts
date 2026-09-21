import type {EmitsToProps, PublicProps} from 'vue'
import type {TableProps} from 'antdv-next'
import type {
  BasicIdMetadata,
  FilterRequest,
  PageRequest,
  ScrollPageResult,
  SYSTEM_CONSTANT,
  TreeSortMetadata,
} from '@loncra/client/commons'
import type {
  RecordActionDefinition,
  RecordActionPayload,
  ResolvedAction,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {DragProp} from '../_util/crud/useDrag'
import type {QueryCollectionProps} from '../basic-crud-query/types'

/** 卡片拖拽方向；不写就是横向 */
export type CardGridDragDirection = 'horizontal' | 'vertical'

/**
 * 卡片形态的 `drag`：直接写 `DragProp` 就行（同表格，方向按横向）；
 * 只有需要纵向（一排一张之类的排布）时才给对象形态 —— 这时 `direction` 才生效。
 */
export type CardGridDragProp<TEntity> =
  | DragProp<TEntity>
  | {dragPreview: DragProp<TEntity>; direction: CardGridDragDirection}

/**
 * **内容层** props：卡片网格自己画什么。
 *
 * 数据 / 分页 / 字典 / 标题 / 动作在 `BasicCrudQuery` 基类里，这里只是把"交给基类"的那几个
 * 原样转发（名字与基类一致），数据用 `v-model` 双向绑定。
 */
export interface QueryCardGridProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends Omit<QueryCollectionProps<TBody, TEntity, TPage, TId>, 'drag' | 'actions'> {
  /** 标题右侧的工具栏动作（转给基类）：数组 = 与默认合并；`false` = 整排不出 */
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  /** 项内动作（转给基类）：数组 = 与默认 `edit` / `detail` / `delete` 合并；`false` = 不要 */
  recordActions?: RecordActionDefinition<TEntity>[] | false
  /** 分页：与表格同一个类型（都由基类渲染那一个 `a-pagination`） */
  pagination?: TableProps['pagination']
  /** 拖拽开关 + 幽灵内容（同表格）；要给方向就写对象形态，`direction` 才生效 */
  drag?: CardGridDragProp<TEntity>
  gridColumns?: number
  selectable?: boolean
  selectedItems?: TEntity[]
}

export type QueryCardGridEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = {
  'update:dataSource': [value: TEntity[]]
  'update:loading': [value: boolean]
  'update:query': [value: FilterRequest | PageRequest]
  'update:selectedItems': [value: TEntity[]]
  'update:pagination': [value: TableProps['pagination']]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
}

export interface QueryCardGridItemSlot<TEntity> {
  record: TEntity
  index: number
  selected: boolean
  dragEnabled: boolean
  onDragStart: (event: DragEvent) => void
  onDragEnd: () => void
  /** 项内动作，已按权限 / `visible` / 运行态解析好；`recordActions: false` 时是空数组 */
  itemActions: ResolvedAction[]
}

export type QueryCardGridItemActionsSlot<TEntity> = Omit<QueryCardGridItemSlot<TEntity>, 'selected'>

export interface QueryCardGridSlots<TEntity> {
  title?: () => unknown
  extra?: () => unknown
  empty?: () => unknown
  item?: (slot: QueryCardGridItemSlot<TEntity>) => unknown
  itemActions?: (slot: QueryCardGridItemActionsSlot<TEntity>) => unknown
}

export type QueryCardGridConstructor = new <
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

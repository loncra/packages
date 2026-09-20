import type {ComputedRef, EmitsToProps, PublicProps} from 'vue'
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
  ToolbarActionContext,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionPageState} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {DefaultCrudEntity, QueryCollectionProps} from '../query-table/types'

export type CardGridPagination = false | (CollectionPageState & Record<string, unknown>)

/** 卡片拖拽方向；不写就是横向 */
export type CardGridDragDirection = 'horizontal' | 'vertical'

/**
 * 卡片形态的 `drag`：直接写 `DragProp` 就行（同表格，方向按横向）；
 * 只有需要纵向（一排一张之类的排布）时才给对象形态 —— 这时 `direction` 才生效。
 */
export type CardGridDragProp<TEntity> =
  | DragProp<TEntity>
  | {dragPreview: DragProp<TEntity>; direction: CardGridDragDirection}

export interface QueryCardGridProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends Omit<QueryCollectionProps<TBody, TEntity, TPage, TId>, 'drag'> {
  pagination?: CardGridPagination
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
  'update:pagination': [value: CardGridPagination]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
}

export interface QueryCardGridItemSlot<TEntity> {
  record: TEntity
  index: number
  selected: boolean
  dragEnabled: boolean
  onDragStart: (event: DragEvent) => void
  onDragEnd: () => void
}

export type QueryCardGridItemActionsSlot<TEntity> = Omit<QueryCardGridItemSlot<TEntity>, 'selected'>

export interface QueryCardGridSlots<TEntity> {
  title?: () => unknown
  extra?: () => unknown
  empty?: () => unknown
  item?: (slot: QueryCardGridItemSlot<TEntity>) => unknown
  itemActions?: (slot: QueryCardGridItemActionsSlot<TEntity>) => unknown
}

export interface QueryCardGridExpose<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  fetchDataSource: () => Promise<void>
  actionContext: ComputedRef<ToolbarActionContext<TEntity>>
}

export interface CrudCardGridProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends QueryCardGridProps<TBody, TEntity, TPage, TId> {
  recordActions?: boolean
  itemActions?: RecordActionDefinition<TEntity>[]
}

export type CrudCardGridEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = QueryCardGridEmits<TEntity, TId> & {
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
}

export interface CrudCardGridItemSlot<TEntity> extends QueryCardGridItemSlot<TEntity> {
  itemActions: ResolvedAction[]
}

export interface CrudCardGridItemActionsSlot<TEntity> extends QueryCardGridItemActionsSlot<TEntity> {
  actions: ResolvedAction[]
}

export interface CrudCardGridSlots<TEntity>
  extends Omit<QueryCardGridSlots<TEntity>, 'item' | 'itemActions'> {
  item?: (slot: CrudCardGridItemSlot<TEntity>) => unknown
  itemActions?: (slot: CrudCardGridItemActionsSlot<TEntity>) => unknown
}

export interface CrudCardGridExpose<TEntity extends BasicIdMetadata<unknown>> {
  fetchDataSource: () => Promise<void | undefined>
  remove: (records: TEntity[]) => void
}

export type QueryCardGridRuntimeProps = QueryCardGridProps<
  DefaultCrudEntity,
  DefaultCrudEntity,
  ScrollPageResult<DefaultCrudEntity>,
  string | number
>

export type CrudCardGridRuntimeProps = CrudCardGridProps<
  DefaultCrudEntity,
  DefaultCrudEntity,
  ScrollPageResult<DefaultCrudEntity>,
  string | number
>

export type QueryCardGridConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: QueryCardGridProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: QueryCardGridProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<QueryCardGridEmits<TEntity, TId>> &
    PublicProps
  $slots: QueryCardGridSlots<TEntity>
} & QueryCardGridExpose<TEntity, TId>

export type CrudCardGridConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudCardGridProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<CrudCardGridEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: CrudCardGridProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<CrudCardGridEmits<TEntity, TId>> &
    PublicProps
  $slots: CrudCardGridSlots<TEntity>
} & CrudCardGridExpose<TEntity>

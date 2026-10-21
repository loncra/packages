import type {CSSProperties, EmitsToProps, PublicProps} from 'vue'
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
import type {BasicCrudQueryClasses, BasicCrudQueryStyles, QueryCollectionProps,} from '../basic-crud-query/types'

export type CardGridDragDirection = 'horizontal' | 'vertical'

export interface QueryCardGridClasses extends BasicCrudQueryClasses {
  cardGrid?: {root?: string; item?: string}
}

export interface QueryCardGridStyles extends BasicCrudQueryStyles {
  cardGrid?: {root?: CSSProperties; item?: CSSProperties}
}

export type CardGridDragProp<TEntity> =
  | DragProp<TEntity>
  | {dragPreview: DragProp<TEntity>; direction: CardGridDragDirection}

export interface QueryCardGridProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends Omit<QueryCollectionProps<TBody, TEntity, TPage, TId>, 'drag' | 'actions'> {
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  recordActions?: RecordActionDefinition<TEntity>[] | false
  pagination?: TableProps['pagination']
  drag?: CardGridDragProp<TEntity>
  gridColumns?: number
  selectable?: boolean
  selectedItems?: TEntity[]
  classes?: QueryCardGridClasses
  styles?: QueryCardGridStyles
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

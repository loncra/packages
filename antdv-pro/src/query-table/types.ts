import type {Component, EmitsToProps, PublicProps, VNode} from 'vue'
import type {TableProps} from 'antdv-next'
import type {ColumnType} from 'antdv-next/dist/table/interface'
import {
  type BasicIdMetadata,
  type DropPosition,
  type FilterRequest,
  type PageRequest,
  type ScrollPageResult,
  SYSTEM_CONSTANT,
  type TreeSortMetadata,
} from '@loncra/client/commons'
import type {
  AuthorityProps,
  RecordActionDefinition,
  RecordActionPayload,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {
  CollectionService,
  DefaultCrudEntity,
} from '../_util/crud/useCollectionData'
import type {DragPreviewContent, DragProp} from '../_util/crud/useDrag'
import type {EnumBucketRequest, PageDictionaries, RefreshOnActivate} from '../basic-crud-query/types'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'

export interface ColumnSearchConfig {
  component?: Component
  props?: Record<string, unknown>
  expression?: string
  queryName?: string
  defaultValue?: unknown
}

export type SearchableColumnType<RecordType extends object = DefaultCrudEntity> =
  ColumnType<RecordType> & {
    search?: ColumnSearchConfig
  }

/**
 * **内容层** props：表格自己画什么。
 *
 * 数据 / 分页 / 字典 / 标题 / 动作在 `BasicCrudQuery` 基类里，这里只是把"交给基类"的那几个
 * 原样转发（名字与基类一致），数据用 `v-model` 双向绑定。
 */
export interface QueryTableProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  columns?: SearchableColumnType<TEntity>[]
  immediate?: boolean
  refreshOnActivate?: RefreshOnActivate
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  /** 标题右侧的工具栏动作：数组 = 与默认 `add`/`deleteSelected` 合并；`false` = 整排不出 */
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  /** 行内动作：数组 = 与默认 `edit`/`detail`/`delete` 合并；`false` = 不要（`操作`列也不补） */
  recordActions?: RecordActionDefinition<TEntity>[] | false
  /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dictionaryCodes`）—— 原样交给基类（枚举桶按模块分组） */
  enums?: EnumBucketRequest[]
  dictionaryCodes?: (string | undefined)[]
  /** 字典加载结果（基类 `v-model` 回给建列的地方） */
  buckets?: EnumBucketsResponseBody
  dictionaries?: PageDictionaries
  bordered?: boolean
  /**
   * **朴素卡片**：把外面那层卡片壳的边框与 body 内边距去掉，让它"贴"进父容器
   * （表单/详情里嵌的表格最常用）。样式由 pro 自己的 `genStyleHooks` 生成（pro 不带 Tailwind），
   * 宿主的 `classes` **仍然优先**（按语义部件合并）⇒ 想再改 header/圆角照旧传 `classes`。
   */
  plain?: boolean
  /** 拖拽开关 + 幽灵内容（同 `QueryCollectionProps.drag`） */
  drag?: DragProp<TEntity>
  onRow?: TableProps['onRow']
  rowKey?: TableProps['rowKey']
  rowSelection?: TableProps['rowSelection'] | false
  pagination?: TableProps['pagination']
  prefixCls?: string
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  selectedRows?: TEntity[]
}

export type QueryTableEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = {
  'update:dataSource': [value: TEntity[]]
  'update:loading': [value: boolean]
  'update:query': [value: FilterRequest | PageRequest]
  'update:selectedRows': [value: TEntity[]]
  'update:pagination': [value: TableProps['pagination']]
  'update:buckets': [value: EnumBucketsResponseBody]
  'update:dictionaries': [value: PageDictionaries]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
  drop: [sorts: TreeSortMetadata<TId>[], target: TEntity, fromIndex: number, toIndex: number]
  treeDrop: [
    sorts: TreeSortMetadata<TId>[],
    drag: TEntity,
    target: TEntity,
    payload: {dropPosition: DropPosition; tree: TEntity[]},
  ]
}

export interface QueryTableSlots<TEntity extends object> {
  title?: () => unknown
  bodyCell?: (args: {
    text: unknown
    record: TEntity
    index: number
    column: SearchableColumnType<TEntity>
  }) => unknown
  expandedRowRender?: (args: {
    record: TEntity
    index: number
    indent: number
    expanded: boolean
  }) => unknown
}

/**
 * Vue 3.5 的 defineComponent 函数重载接不住泛型 setup。
 * 实现用对象形 defineComponent，导出时断言成这个 constructor，调用方才能带实体泛型使用。
 */
export type QueryTableConstructor = new <
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

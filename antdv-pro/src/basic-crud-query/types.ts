import type {ComputedRef, EmitsToProps, PublicProps, VNode, VNodeChild} from 'vue'
import type {TableProps} from 'antdv-next'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
  BasicIdMetadata,
  DropPosition,
  FilterRequest,
  PageRequest,
  ScrollPageResult,
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
import type {CardGridPagination} from '../query-card-grid/types'
import type {DefaultCrudEntity, QueryCollectionProps} from '../query-table/types'
import type {PageDicts, PageEnums} from './dictionaries'

/** 选中集合挂在哪一个 prop 上（表格 `selectedRows` / 卡片 `selectedItems`） */
export type BasicCrudQuerySelectedKey = 'selectedRows' | 'selectedItems'

export interface BasicCrudQueryProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends Omit<
  QueryCollectionProps<TBody, TEntity, TPage, TId>,
  // 屏蔽继承来的 `actions`：本层叫 `toolbarActions`，不与行内 / 项内动作混名
  'actions'
> {
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  /**
   * 标题右侧的工具栏动作，与 `title` 同形：给数组就用（先与默认的 `add` / `deleteSelected` 合并）；
   * 给 `false` 整个右侧都不出（连页面自给的 `#extra` 插槽一起关）。
   */
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  /** 选中集合的 prop 名（由形态组件指定） */
  selectedKey?: BasicCrudQuerySelectedKey
  /** 分页（表格 / 卡片共用同一份，由本组件渲染统一分页） */
  pagination?: TableProps['pagination'] | CardGridPagination
  selectedRows?: TEntity[]
  selectedItems?: TEntity[]
  /**
   * 行内 / 项内动作，与 `title` 同形：给数组就用（先与默认的 `edit` / `detail` / `delete` 合并）；
   * 给 `false` 不要行内 / 项内动作（不给 `resolveRecordActions`，也不补"操作"列）。
   */
  recordActions?: RecordActionDefinition<TEntity>[] | false
  /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dicts`） */
  enumIds?: (string | undefined)[]
  dictCodes?: (string | undefined)[]
  /** 字典加载结果（`v-model` 回给建列的地方） */
  buckets?: PageEnums
  dicts?: PageDicts
}

export type BasicCrudQueryEmits<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> = {
  'update:dataSource': [value: TEntity[]]
  'update:loading': [value: boolean]
  'update:query': [value: FilterRequest | PageRequest]
  'update:selectedRows': [value: TEntity[]]
  'update:selectedItems': [value: TEntity[]]
  'update:pagination': [value: unknown]
  'update:buckets': [value: PageEnums]
  'update:dicts': [value: PageDicts]
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

export interface BasicCrudQuerySlots {
  /** 内容：表格 / 卡片网格（数据由形态组件自己通过 v-model 传进来，插槽不带参数） */
  default?: () => VNodeChild
  /** 页面自带标题；不给就用 `CrudConfig.resolveDefaultTitle` */
  title?: () => VNodeChild
  /** 标题右侧；不给就放动作按钮 */
  extra?: () => VNodeChild
}

export interface BasicCrudQueryExpose<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  fetchDataSource: () => Promise<void>
  remove: (records: TEntity[]) => void
  actionContext: ComputedRef<ToolbarActionContext<TEntity>>
  /** 行内 / 项内动作（形态组件要画"操作"列或卡片动作时用） */
  resolveRecordActions: (record: TEntity) => ResolvedAction[]
  onRecordAction: (id: string, record: TEntity) => void
  /** 有行内 / 项内动作 */
  hasRecordActions: ComputedRef<boolean>
  /** 需要自动开行选择（有 delete 权限或声明了内置批量动作） */
  needsBulkSelection: ComputedRef<boolean>
}

export type BasicCrudQueryRuntimeProps = BasicCrudQueryProps<
  DefaultCrudEntity,
  DefaultCrudEntity,
  ScrollPageResult<DefaultCrudEntity>,
  string | number
>

export type BasicCrudQueryConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: BasicCrudQueryProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: BasicCrudQueryProps<TBody, TEntity, TPage, TId> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps
  $slots: BasicCrudQuerySlots
} & BasicCrudQueryExpose<TEntity, TId>

import type {EmitsToProps, PublicProps, VNode, VNodeChild} from 'vue'
import type {TableProps} from 'antdv-next'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
  BasicIdMetadata,
  FilterRequest,
  PageRequest,
  ScrollPageResult,
} from '@loncra/client/commons'
import type {
  AuthorityProps,
  RecordActionDefinition,
  RecordActionPayload,
  ResolvedAction,
  ToolbarActionDefinition,
  ToolbarActionPayload,
} from '../_util/crud/actions'
import type {CollectionExpose} from '../_util/crud/collectionExpose'
import type {CollectionService} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {DataDictionaryMetadata, EnumBucketsResponseBody} from '@loncra/client/resource'

/** 一个枚举桶的定位：模块 + 枚举 id（声明里的 `enumRef` 用它） */
export interface EnumRef {
  module: string
  id: string
}

/** 要加载的一组枚举桶：模块 + 该模块下的枚举 id 列表（对应后端 `EnumBucketsRequestBody` 的一项） */
export interface EnumBucketRequest {
  module: string
  ids: string[]
}

/** 数据字典：字典 code → 字典项（client 的原样类型，含 code/name/valueType/metadata/children） */
export type PageDictionaries = Record<string, DataDictionaryMetadata[]>

/** 选中集合挂在哪一个 prop 上（表格 `selectedRows` / 卡片 `selectedItems`） */
export type BasicCrudQuerySelectedKey = 'selectedRows' | 'selectedItems'

/**
 * 被 KeepAlive 缓存的实例从缓存切回（onActivated）时如何刷新数据。
 * - `true`（默认）：自动重新取数
 * - `false`：切回不刷新
 * - 函数：完全交给调用方决定（组件不再自动取数），需要的数据请自行通过 v-model 绑定获取
 */
export type RefreshOnActivate = boolean | (() => void | Promise<void>)

/**
 * **集合层** props：取数 / 标题 / 权限 / 动作 / 字典 / 拖拽 / 数据与查询 —— 表格与卡片共用的那一层。
 * 形态组件（`QueryTable` / `QueryCardGrid`）与两道门面都在这之上扩展自己那部分（列、分页形态…）。
 */
export interface QueryCollectionProps<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  service: CollectionService<TBody, TEntity, TPage, TId>
  immediate?: boolean
  refreshOnActivate?: RefreshOnActivate
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  hasPermission?: (permission: string) => boolean
  authority?: AuthorityProps
  /**
   * 拖拽开关 + 幽灵内容（一个口两件事）：`true` = 可拖（幽灵缺省是主键）；
   * `(record) => 内容` = 可拖且它就是幽灵；`false` / 不给 = 不可拖。
   */
  drag?: DragProp<TEntity>
  prefixCls?: string
  rootClass?: string
  dataSource?: TEntity[]
  loading?: boolean
  query?: FilterRequest | PageRequest
  /** 主键字段名（或 antd 的取键函数）；缺省用 `SYSTEM_CONSTANT.ID_NAME`。表与卡片网格共用 */
  rowKey?: TableProps['rowKey']
}

export interface BasicCrudQueryProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TPage extends ScrollPageResult<TEntity> = ScrollPageResult<TEntity>,
> extends QueryCollectionProps<TBody, TEntity, TPage, TId> {
  /** 卡片头，与 `DataLoadingCardPlan` 同形：`VNode` 直接用、`false` 不要卡片头、不给走默认标题 */
  title?: VNode | boolean
  /**
   * 标题右侧的工具栏动作，与 `title` 同形：给数组就用（先与默认的 `add` / `deleteSelected` 合并）；
   * 给 `false` 整个右侧都不出（连页面自给的 `#extra` 插槽一起关）。
   */
  toolbarActions?: ToolbarActionDefinition<TEntity>[] | false
  /** 选中集合的 prop 名（由形态组件指定） */
  selectedKey?: BasicCrudQuerySelectedKey
  /** 分页（表格 / 卡片共用同一份，由本组件渲染统一分页）：就是 antd 的分页对象 */
  pagination?: TableProps['pagination']
  selectedRows?: TEntity[]
  selectedItems?: TEntity[]
  /**
   * 行内 / 项内动作，与 `title` 同形：给数组就用（先与默认的 `edit` / `detail` / `delete` 合并）；
   * 给 `false` 不要行内 / 项内动作（不给 `resolveRecordActions`，也不补"操作"列）。
   */
  recordActions?: RecordActionDefinition<TEntity>[] | false
  /** 系统字典：要加载什么（声明侧 `list.enums` / `list.dictionaryCodes`）—— 枚举桶按模块分组 */
  enums?: EnumBucketRequest[]
  dictionaryCodes?: (string | undefined)[]
  /** 字典加载结果（`v-model` 回给建列的地方） */
  buckets?: EnumBucketsResponseBody
  dictionaries?: PageDictionaries
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
  'update:pagination': [value: TableProps['pagination']]
  'update:buckets': [value: EnumBucketsResponseBody]
  'update:dictionaries': [value: PageDictionaries]
  action: [payload: ToolbarActionPayload<TEntity> | RecordActionPayload<TEntity>]
  add: []
  edit: [record: TEntity]
  detail: [record: TEntity]
  deleted: [records: TEntity[]]
}

export interface BasicCrudQuerySlots {
  /** 内容：表格 / 卡片网格（数据由形态组件自己通过 v-model 传进来，插槽不带参数） */
  default?: () => VNodeChild
  /** 页面自带标题；不给就用 `CrudConfig.resolveDefaultTitle` */
  title?: () => VNodeChild
  /** 标题右侧；不给就放动作按钮 */
  extra?: () => VNodeChild
}

/**
 * 内核暴露给**形态组件**（`QueryTable` / `QueryCardGrid`）的能力：对外那份（`CollectionExpose`）
 * 加上只有内核能算的四个动作相关项 —— 权限、默认动作合并、运行态都在内核里，所以解析也只能在这。
 * 宿主拿到的 ref 只会有 `CollectionExpose` 那两个成员，看不到这里的内部契约。
 *
 * ⚠️ **暴露出去的成员一律写"值"**：Vue 对 `expose` 出来的 `Ref` / `ComputedRef` 会自动解包
 * （`getComponentPublicInstance` 里是 `new Proxy(proxyRefs(markRaw(instance.exposed)))`）⇒
 * 消费方（模板 ref）读到的**已经是当前值**，写 `.value` 只会拿到 `undefined`。
 * 要保响应式就在 `expose` 处用 getter（见 `BasicCrudQuery.tsx` 的 `expose`）。
 */
export interface BasicCrudQueryExpose<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CollectionExpose<TEntity> {
  /** 行内 / 项内动作（形态组件要画"操作"列或卡片动作时用） */
  resolveRecordActions: (record: TEntity) => ResolvedAction[]
  onRecordAction: (id: string, record: TEntity) => void
  /** 有行内 / 项内动作 */
  hasRecordActions: boolean
  /** 需要自动开行选择（有 delete 权限或声明了内置批量动作） */
  needsBulkSelection: boolean
}

export type BasicCrudQueryConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TPage extends ScrollPageResult<TEntity>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: BasicCrudQueryProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps,
) => {
  $props: BasicCrudQueryProps<TId, TBody, TEntity, TPage> &
    EmitsToProps<BasicCrudQueryEmits<TEntity, TId>> &
    PublicProps
  $slots: BasicCrudQuerySlots
} & BasicCrudQueryExpose<TEntity, TId>

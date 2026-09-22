import type {Component, PublicProps, VNode} from 'vue'
import type {TableProps} from 'antdv-next'
import type {
  BasicIdMetadata,
  NameValueEnumMetadata,
  ScrollPageResult,
  SYSTEM_CONSTANT,
} from '@loncra/client/commons'
import type {
  AuthorityProps,
  RecordActionDefinition,
  ToolbarActionDefinition,
} from '../_util/crud/actions'
import type {CollectionService} from '../_util/crud/useCollectionData'
import type {DragProp} from '../_util/crud/useDrag'
import type {CrudNavigateTarget} from '../_util/crud/navigate'
import type {ColumnSearchConfig, SearchableColumnType} from '../query-table/types'
import type {EnumBucketRequest, EnumRef, PageDictionaries} from '../basic-crud-query/types'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'

// #region 声明：核心（三种形态共用）

/** 页面声明的路由名（真值在宿主，pro 只负责取出来交给跳转实现） */
export interface CrudPageRoutes {
  home?: string
  add?: string
  edit?: string
  detail?: string
}

/**
 * 三种形态**共享的那部分**声明。放页面的 `xxx.page.ts` 里只写一次，
 * 再由 `defineHomePage`（以后的 defineFormPage / defineDetailPage）合进各自的形态声明。
 */
export interface CrudPageCore<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> {
  /**
   * 列表只需要"读得到数据"：与 `QueryTable` / `CrudTable` 吃的是**同一个联合**
   * （只读的 `find` / `page` 服务也能用）。`save` 是表单形态的事，别在这里要求。
   * `TPage` 固定用 `ScrollPageResult<TEntity>`：只读服务自己的 `TotalPage<T>` 是它的子类型，
   * 在 `page()` 的返回位置协变 ⇒ 不必要再往声明层透一个类型参数。
   */
  service: CollectionService<TBody, TEntity, ScrollPageResult<TEntity>, TId>
  /** 主键字段名；不传时表格用 `SYSTEM_CONSTANT.ID_NAME` */
  rowKey?: keyof TEntity & string
  /** 列/字段 label 的 i18n 前缀，如 'authServer.role' */
  i18nPrefix: string
  routes?: CrudPageRoutes
  /** 操作轨迹表名（宿主自己的审计表标识）；列表不用，表单/详情壳以后用 */
  operationDataTraceTarget?: string
  /**
   * 字段字典：`labelKey` / `format`（本体）与 `enumRef` / `dictId`（来源）的唯一事实来源。
   * 来源的**加载清单按形态从这里推导**（列表只收"列上有搜索项"的那些，见 `collectListSources`）
   * ⇒ 页面不必再写一份 `enums` / `dictionaryCodes`。
   */
  fields?: PageFieldsDictionary<TEntity>
  /**
   * label 解析：key → 文案（宿主声明层给一行 `(k, n) => i18n.global.t(k, n)`）。
   * 缺省回退 `${i18nPrefix}.${key}`（可见、可调试，不静默变空）。
   */
  i18nResolver?: (key: string, named?: Record<string, unknown>) => string
  /**
   * 本页自己的跳转实现：给了就用它，否则落到 `CrudConfig.onNavigate` 兜底。
   * 泛型在这一层成立，页面能直接读业务字段决定跳转参数
   * （某个页面要用 name / 其它值当参数时，不必去全局配置里堆 if/else）。
   * 内嵌场景（宿主给了形态名，如 `'picker'`）应当直接 return。
   */
  onNavigate?: (target: CrudNavigateTarget<TEntity>) => void
}

// #endregion

// #region 字段与声明上下文（三种形态共用）

/** 注册表 key：内置值有补全提示，同时允许自定义（见 `defineFormatter` / `defineFieldComponent`） */
type BuiltinKey<T extends string> = T | (string & {})

/**
 * 值格式名：**只断言"值是什么形状 / 怎么显示"**，与"取值来源"无关（来源见 `PageLookupFieldSpec`）。
 *
 * 内置七个：`'enum'` / `'enumList'`（值是 `{name, value}` 枚举元数据，显示取 `name`）、
 * `'dict'` / `'dictList'`（值是整条字典项，或裸 code）、
 * `'date'` / `'dateTime'`（显示用，格式串来自 `CrudConfigProvider.dateFormat` / `dateTimeFormat`）、
 * `'byte'`（字节数 → 可读大小）。
 *
 * ⚠️ "值是**裸 code/id**、却要显示名称"是另一件事：`enum` **不做形状断言**，裸值就原样显示
 * （要按来源查名得另加格式，如以后可能加的 `enumCode`）—— 别把"要求来源"加到 `enum` 上。
 */
export type PageValueFormat = BuiltinKey<
  'enum' | 'enumList' | 'dict' | 'dictList' | 'date' | 'dateTime' | 'byte'
>

/** 字段组件名（内置 input/password/textarea/number/select/date/dateRange，见 registry） */
export type PageFieldComponent = BuiltinKey<
  'input' | 'password' | 'textarea' | 'number' | 'select' | 'date' | 'dateRange'
>

/**
 * 字段**本体**：叫什么（i18n）+ 值是什么形状 / 怎么显示。三种形态共用。
 * 形态条目里写了就以条目为准（`buildListColumns` 用 `{...fields[key], ...column}` 合并）。
 */
export interface PageFieldSpec {
  labelKey?: string
  /** formatter 名。**只断言值的形状**（见 `PageValueFormat`），不要求任何来源 */
  format?: PageValueFormat
}

/**
 * 字段的**取值来源**：值是裸 code/id、或组件要靠它喂 options 时才写。
 *
 * 与 `format` **正交** —— `format` 说"值长什么样"，来源说"值/选项从哪来"。两个用途：
 * ① 给搜索下拉 / 表单选择组件喂 options（桶 → 组件 `mapOptions`、字典 → `dictOptions`）；
 * ② 值是裸 code 时按它查名（字典会回查；枚举的裸值格式以后再加，见 `PageValueFormat`）。
 *
 * 加载清单**按形态从字段推导**（列表见 `collectListSources`），页面不必再抄一份 `enums` /
 * `dictionaryCodes`。只有"详情"不吃来源：它的值自带 `{name, value}`，显示不需要桶。
 */
export interface PageLookupFieldSpec extends PageFieldSpec {
  /** 枚举桶定位（模块 + 枚举 id） */
  enumRef?: EnumRef
  /** 数据字典 code */
  dictId?: string
}

/** 字段字典（按实体字段名索引）：写在 core 的 `xxx.page.ts` 里，页面只写一次 */
export type PageFieldsDictionary<TEntity> = Partial<
  Record<keyof TEntity & string, PageLookupFieldSpec>
>

/**
 * 声明里的函数拿到的**声明级**上下文。故意很小：**没有 router / i18n / 弹层**——
 * 那些是宿主环境，声明文件本身是宿主代码，要用就直接 import。
 */
export interface PageDeclContext {
  /** 宿主形态名：宿主自己起名（如 `'picker'`）；不传 = 宿主没给形态名（整页） */
  variant?: string
  /** 壳传进来的宿主数据（子表 ref、查询条件等声明管不到的东西） */
  extra: Record<string, unknown>
}

/**
 * **字段级**上下文：表单的 `props` / `rules` 这类"按字段求值、要读当前实体"的函数拿它。
 * 与声明级上下文分开 —— 那种函数必须有 `entity`，而声明级的 `visible` / `recordActions` 不需要。
 * （对齐宿主旧 kit 的 `PageFieldRenderContext`；form 形态落地时启用。）
 */
export interface PageFieldRenderContext<TBody> {
  /** 当前实体（只读用法；写初值走页级钩子） */
  entity: TBody
  /** label 解析：与页面声明的 `i18nResolver` 同一份 */
  t: (key: string, named?: Record<string, unknown>) => string
  variant?: string
  extra: Record<string, unknown>
}

// #endregion

// #region 声明：列表形态

/**
 * 声明式搜索项：`QueryTable` 的 `ColumnSearchConfig` 再放宽两点 ——
 * `component` 可以是注册表 key（构建列时由 `resolveFieldSpec` 解析成组件），
 * `props` 可以是函数（构建列时求值，跟随语言/形态）。
 * 其余字段（`expression` / `queryName` / `defaultValue`）原样透传给 `QueryTable`。
 */
export interface PageSearchConfig extends Omit<ColumnSearchConfig, 'component' | 'props'> {
  component: PageFieldComponent | Component
  props?: Record<string, unknown> | ((ctx: PageDeclContext) => Record<string, unknown>)
}

/**
 * 列表列：**字段本体与来源**都从字段字典继承（`extends PageLookupFieldSpec`），条目里写了就以条目为准
 * （`buildListColumns` 用 `{...fields[key], ...column}` 合并）。
 */
export interface PageListColumn<TEntity> extends PageLookupFieldSpec {
  /**
   * 列标识。**优先写实体字段名**（label 兜底用它；搜索项没给 `queryName` 时也按它拼查询名）。
   *
   * 拼查询名会把**第一段**从实体字段名转成**表字段名**（`realName` → `filter_[real_name_like]`）：
   * 后端 `filter_[]` 的顶层字段要的是表字段，而列 `key` 必须是实体字段名（`readPath` 按它取值）。
   * 点后面的路径段不转（后端嵌套段就是 camelCase）；要跟表字段不一致就写显式 `queryName`。
   *
   * 两种例外：
   * ① **路径**：写 `a.b.c`（数据不在顶层字段时，如 `data.details.x`），pro 按路径取值（见 `readPath`）；
   * ② **虚拟列名**：数据根本不在实体上，随便起，但必须自带 `labelKey`，搜索要写显式 `queryName`。
   */
  key: string
  /**
   * 直接写死的列标题：**不查字典、不过翻译**，给了它就不再走 `labelKey` / `${i18nPrefix}.${key}`。
   * 要跟着语言切换就别用它（写 `labelKey`）。
   */
  title?: string
  width?: number
  ellipsis?: boolean
  /** 声明式搜索项 */
  search?: PageSearchConfig
  /**
   * 逃生：自定义这一格的内容。返回 `undefined` 表示不认领，交回表格渲染它自己算好的内容。
   */
  render?: (value: unknown, record: TEntity) => unknown
  /** 该形态下是否显示这一列；缺省显示 */
  visible?: (ctx: PageDeclContext) => boolean
}

/** 列表条目：裸 key 或完整列 */
export type PageListEntry<TEntity> = (keyof TEntity & string) | PageListColumn<TEntity>

export interface PageListDefinition<TEntity extends BasicIdMetadata<unknown>> {
  authority?: AuthorityProps
  /**
   * 需要预加载的枚举桶：**按模块分组**（桶 = 模块 + 枚举 id 索引，见 `EnumBucketRequest`）。
   * module 写 `SYSTEM_MODULE_NAME.*`、id 写 `SYSTEM_ENUM_TYPE.*`，别写字符串字面量。
   */
  enums?: EnumBucketRequest[]
  /**
   * 需要预加载的**数据字典 code**（写宿主常量，如 `SKILL_GROUP_CODE_PREFIX`）。
   * 与 `enums` 同构：pro 自己走 client 拉（`findDataDictionariesByCodes`），宿主不接线；
   * 字段上写 `dictId` 消费它。**名字与内容层/基类的 `dictionaryCodes` 一致**（加载结果叫 `dictionaries`）。
   */
  dictionaryCodes?: string[]
  /** 列顺序 = 数组顺序；按形态显隐用列自己的 `visible` */
  columns: PageListEntry<TEntity>[]
  /**
   * 行拖拽排序 + 幽灵内容（一个口两件事）：
   * `true` = 可拖（幽灵缺省是主键）；`(record) => 内容` = 可拖且它就是幽灵（推荐 `(record) => record.name`）。
   */
  drag?: DragProp<TEntity>
  rowSelection?: TableProps['rowSelection'] | false
  /** 行内动作（名字与内容层/基类的 `recordActions` 一致）；函数形态用于按 `variant` 裁剪动作集合 */
  recordActions?:
    | RecordActionDefinition<TEntity>[]
    | ((ctx: PageDeclContext) => RecordActionDefinition<TEntity>[])
  /**
   * 标题栏动作（名字与内容层/基类的 `toolbarActions` 一致）：与 pro 内置的新增按钮**合并**
   * （同 id 后者覆盖）。业务自己的导出、批量动作都写这里 —— pro 不预置任何业务动作。
   */
  toolbarActions?: ToolbarActionDefinition<TEntity>[]
}

/** `Home.vue` 的声明 = 核心 + 列表（`defineHomePage` 产出） */
export interface CrudListPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> extends CrudPageCore<TBody, TEntity, TId> {
  list: PageListDefinition<TEntity>
}

// #endregion

// #region 注册表（扩展点）

/**
 * 字段组件注册表的一项。**组件专属的约定全收在这里**
 * （默认 props、枚举选项怎么喂、只给搜索项用的外观），builder 里不写 `component === 'x'` 分支。
 */
export interface FieldComponentSpec {
  component: Component
  /** 通用默认 props */
  defaults?: Record<string, unknown>
  /** 枚举桶 → 组件 props；默认 `{options, fieldNames: {label: 'name'}}` */
  mapOptions?: (options: NameValueEnumMetadata<number | string>[]) => Record<string, unknown>
}

export interface FormatContext {
  key: string
  record: unknown
  /** 该条目生效的枚举桶定位（条目 `enumRef` ?? 字典 `enumRef`）—— 值自带元数据时用不到 */
  enumRef?: EnumRef
  /** 该条目生效的数据字典 code（条目 `dictId` ?? 字典 `dictId`）—— 值是裸 code 时才用得到 */
  dictId?: string
  buckets: EnumBucketsResponseBody
  /** 声明里 `dictionaries` 预载回来的字典 */
  dictionaries: PageDictionaries
}

/** formatter：返回值直接当单元格内容渲染（string 或 VNode） */
export type ValueFormatter = (value: unknown, ctx: FormatContext) => string | VNode

/**
 * 两张注册表。内置表见 `registry.ts` 的 `DEFAULT_*`；
 * 宿主 `CrudConfig.fieldComponents` / `formatters` 在它们之上**逐 key 覆盖**。
 */
export interface PageRegistry {
  fieldComponents: Record<string, FieldComponentSpec>
  formatters: Record<string, ValueFormatter>
}

// #endregion

// #region 组件契约

export interface CrudHomePageProps<
  TId = string | number,
  TBody extends BasicIdMetadata<TId> = BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
> {
  page: CrudListPage<TBody, TEntity, TId>
  /** 宿主形态名：宿主自己起名（如 `'picker'`）；不传 = 宿主没给形态名（整页） */
  variant?: string
  /** 宿主数据，透传给声明里的 `visible` / `recordActions`（见 `PageDeclContext.extra`） */
  extra?: Record<string, unknown>
}

/**
 * 列表页壳暴露给宿主的能力。
 *
 * ⚠️ **一律是"值"不是 ref**：Vue 对 `expose` 出来的 ref 会自动解包（`proxyRefs`）⇒ 宿主写
 * `table.value?.buckets` 就是当前值，写成 `table.value?.buckets.value` 只会得到 `undefined`。
 */
export interface CrudHomePageExpose<TEntity> {
  fetchDataSource: () => Promise<void | undefined> | undefined
  clearDataSource: () => void
  /** 当前数据（`v-model:data-source` 回流的那份） */
  dataSource: TEntity[]
  /**
   * 页面声明里 `list.enums` 加载回来的枚举桶：壳里的弹层 / 条件判断要用同一份
   * （声明已经拉了，别在壳里再发一次同样的请求）。
   */
  buckets: EnumBucketsResponseBody
}

export interface CrudHomePageSlots<TEntity extends object> {
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
 * Vue 3.5 的 `defineComponent` 函数重载接不住泛型 setup。
 * 实现用对象形 `defineComponent`，导出时断言成这个 constructor，调用方才能带实体泛型使用。
 */
export type CrudHomePageConstructor = new <
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  props: CrudHomePageProps<TId, TBody, TEntity> & PublicProps,
) => {
  $props: CrudHomePageProps<TId, TBody, TEntity> & PublicProps
  $slots: CrudHomePageSlots<TEntity>
} & CrudHomePageExpose<TEntity>

// #endregion

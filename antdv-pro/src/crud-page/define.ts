import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
    CrudCardGridDefinition,
    CrudDetailDefinition,
    CrudFormCore,
    CrudFormDefinition,
    CrudPageCore,
    CrudTableDefinition,
    PageCardGridDefinition,
    PageDetailDefinition,
    PageFormDefinition,
    PageTableDefinition,
} from './types'

/**
 * 各形态的**声明入口**都放这里（`defineHomePage` / `defineCardGridPage` / `defineFormPage` /
 * `defineDetailPage`）。
 *
 * 分工：**核心**（`CrudPageCore`：service / rowKey / i18nPrefix / routes / fields 字典）写在页面的
 * `xxx.page.ts` 里各形态共用一份；形态文件（`xxx.form.page.ts` …）只写自己那部分；
 * 这几个函数把它们合起来，返回对应壳能直接吃的完整对象 —— 所以**页面壳不用知道拆过**。
 *
 * 它们都是恒等合并（`{...core, <形态>}`），运行时不做任何解析；存在的目的是用类型约束声明
 * （写错 key 编辑器报红）。实体类型无法从 `service` 可靠推断，字段级检查要显式写类型参数：
 * `defineHomePage<RoleSavePayload, RoleEntity>(roleCore, {...})`。
 */

/** 声明表格页：核心（service / i18nPrefix / routes / fields / …）+ 表格形态 */
export function defineHomePage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  table: PageTableDefinition<TEntity>,
): CrudTableDefinition<TBody, TEntity, TId> {
  return {...core, table}
}

/**
 * 声明表单页（新增 / 编辑共用）：核心 + 表单形态。
 *
 * 核心参数收的是 `CrudFormCore` ⇒ **`service` 可省**：只提交（`form.submit`）、不取数不编辑的
 * "发送"型页面不必硬造一个读侧服务。
 */
export function defineFormPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudFormCore<TBody, TEntity, TId>,
  form: PageFormDefinition<TBody, TEntity>,
): CrudFormDefinition<TBody, TEntity, TId> {
  return {...core, form}
}

/** 声明详情页：核心 + 详情形态 */
export function defineDetailPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  detail: PageDetailDefinition<TEntity, TId>,
): CrudDetailDefinition<TBody, TEntity, TId> {
  return {...core, detail}
}

/**
 * 声明**卡片网格页**（`Home.vue` 的卡片布局）：核心 + 卡片网格形态。
 *
 * 与 `defineHomePage` 的关系：形态同属"列表"，但布局是卡片（门面渲染 `CrudCardGrid`，
 * 卡片外观由壳的 `#item` 插槽画）⇒ 声明形状不同（无 `columns`、`drag` 带方向 + 有落库口 `onDrop`），
 * 所以**不共用** `PageTableDefinition`（权限 / 预载来源 / 动作那五样两边共用 `PageCommonDefinition`），
 * 与 `defineFormPage` / `defineDetailPage` 同款分法。
 */
export function defineCardGridPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  cardGrid: PageCardGridDefinition<TEntity>,
): CrudCardGridDefinition<TBody, TEntity, TId> {
  return {...core, cardGrid}
}

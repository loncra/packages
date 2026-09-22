import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
  CrudDetailDefinition,
  CrudFormDefinition,
  CrudListPage,
  CrudPageCore,
  PageDetailDefinition,
  PageFormDefinition,
  PageListDefinition,
} from './types'

/**
 * 三种形态的**声明入口**都放这里（`defineHomePage` / `defineFormPage` / `defineDetailPage`）。
 *
 * 分工：**核心**（`CrudPageCore`：service / rowKey / i18nPrefix / routes / fields 字典）写在页面的
 * `xxx.page.ts` 里三种形态共用一份；形态文件（`xxx.form.page.ts` …）只写自己那部分；
 * 三个函数把它们合起来，返回对应壳能直接吃的完整对象 —— 所以**页面壳不用知道拆过**。
 *
 * 它们都是恒等合并（`{...core, <形态>}`），运行时不做任何解析；存在的目的是用类型约束声明
 * （写错 key 编辑器报红）。实体类型无法从 `service` 可靠推断，字段级检查要显式写类型参数：
 * `defineHomePage<RoleSavePayload, RoleEntity>(roleCore, {...})`。
 */

/** 声明列表页：核心（service / i18nPrefix / routes / fields / …）+ 列表形态 */
export function defineHomePage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  list: PageListDefinition<TEntity>,
): CrudListPage<TBody, TEntity, TId> {
  return {...core, list}
}

/** 声明表单页（新增 / 编辑共用）：核心 + 表单形态 */
export function defineFormPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
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

import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CrudListPage, CrudPageCore, PageListDefinition} from './types'

/**
 * 三种形态的**声明入口**都放这里（`defineHomePage`；`defineFormPage` / `defineDetailPage`
 * 随表单、详情形态进来时并排加）。
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

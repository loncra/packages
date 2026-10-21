import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CrudPageCore} from './types'
import type {CrudCardGridDefinition, PageCardGridDefinition} from './card-grid/types'
import type {CrudDetailDefinition, PageDetailDefinition} from './detail/types'
import type {CrudFormCore, CrudFormDefinition, PageFormDefinition} from './form/types'
import type {CrudTableDefinition, PageTableDefinition} from './home/types'

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

import {renderIconFont} from '@loncra/antdv'
import type {BasicIdMetadata} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'
import {withCount} from '../format'
import {type ActionContext, type ActionDefinition, BUILTIN_ACTION_ID} from './actions'
import {isDeletableService} from './useCrudDelete'

export interface CollectionAuthorityProps {
  add?: string | boolean
  edit?: string | boolean
  detail?: string | boolean
  delete?: string | boolean
  export?: string | boolean
}

export interface DefaultToolbarActionsOptions<TEntity extends BasicIdMetadata<unknown>> {
  authority?: CollectionAuthorityProps
  locale: CrudLocale
  /** 传给 renderIconFont 的额外 class，如表格标题区用 `align` */
  iconClass?: string
  onAdd: (ctx: ActionContext<TEntity>) => void
  onExport: (ctx: ActionContext<TEntity>) => void | Promise<void>
}

export function createDefaultToolbarActions<TEntity extends BasicIdMetadata<unknown>>(
  options: DefaultToolbarActionsOptions<TEntity>,
): ActionDefinition<TEntity>[] {
  const iconClass = options.iconClass
  return [
    {
      id: 'add',
      permission: options.authority?.add,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: () => options.locale.add,
      icon: () => renderIconFont('loncra-file-plus-corner', iconClass),
      run: (ctx) => options.onAdd(ctx),
    },
    {
      id: 'export',
      permission: options.authority?.export,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      label: (ctx) =>
        ctx.selectedItems.length > 0
          ? withCount(options.locale.exportSelected, ctx.selectedItems.length)
          : options.locale.exportAll,
      icon: () => renderIconFont('loncra-panel-right-close', iconClass),
      run: (ctx) => options.onExport(ctx),
    },
  ]
}

export interface DefaultBulkActionsOptions<TEntity extends BasicIdMetadata<unknown>> {
  authority?: CollectionAuthorityProps
  service: unknown
  locale: CrudLocale
  remove: (records: TEntity[]) => void
}

export function createDefaultBulkActions<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId,
>(options: DefaultBulkActionsOptions<TEntity>): ActionDefinition<TEntity>[] {
  return [
    {
      id: BUILTIN_ACTION_ID.DELETE_SELECTED,
      permission: options.authority?.delete,
      danger: true,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 && isDeletableService<TBody, TEntity, TId>(options.service),
      label: (ctx) => withCount(options.locale.deleteSelected, ctx.selectedItems.length),
      icon: () => renderIconFont('loncra-archive-x'),
      run: (ctx) => options.remove(ctx.selectedItems),
    },
  ]
}

export interface DefaultItemActionsOptions<TEntity extends BasicIdMetadata<unknown>> {
  authority?: CollectionAuthorityProps
  service: unknown
  locale: CrudLocale
  remove: (records: TEntity[]) => void
  onEdit: (record: TEntity) => void
  onDetail: (record: TEntity) => void
}

export function createDefaultItemActions<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId,
>(options: DefaultItemActionsOptions<TEntity>): ActionDefinition<TEntity>[] {
  return [
    {
      id: BUILTIN_ACTION_ID.EDIT,
      permission: options.authority?.edit,
      label: () => options.locale.edit,
      icon: () => renderIconFont('loncra-file-pen-line'),
      run: (ctx) => {
        if (ctx.record) {
          options.onEdit(ctx.record)
        }
      },
    },
    {
      id: BUILTIN_ACTION_ID.DETAIL,
      permission: options.authority?.detail,
      label: () => options.locale.detail,
      icon: () => renderIconFont('loncra-file-search'),
      run: (ctx) => {
        if (ctx.record) {
          options.onDetail(ctx.record)
        }
      },
    },
    {
      id: BUILTIN_ACTION_ID.DELETE,
      permission: options.authority?.delete,
      danger: true,
      enabled: () => isDeletableService<TBody, TEntity, TId>(options.service),
      label: () => options.locale.deleteText,
      icon: () => renderIconFont('loncra-archive-x'),
      run: (ctx) => {
        if (ctx.record) {
          options.remove([ctx.record])
        }
      },
    },
  ]
}

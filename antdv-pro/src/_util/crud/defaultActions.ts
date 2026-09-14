import {renderIconFont} from '@loncra/antdv'
import type {BasicCrudService, BasicIdMetadata} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'
import type {ActionContext, ActionDefinition} from './actions'

export interface CollectionAuthorityProps {
  add?: string | boolean
  edit?: string | boolean
  detail?: string | boolean
  delete?: string | boolean
  export?: string | boolean
}

function withCount(template: string, count: number) {
  return template.replace('{count}', String(count))
}

export interface DefaultToolbarActionsOptions<TEntity> {
  authority?: CollectionAuthorityProps
  locale: CrudLocale
  /** 传给 renderIconFont 的额外 class，如表格标题区用 `align` */
  iconClass?: string
  onAdd: (ctx: ActionContext<TEntity>) => void
  onExport: (ctx: ActionContext<TEntity>) => void | Promise<void>
}

export function createDefaultToolbarActions<TEntity>(
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

export interface DefaultBulkActionsOptions<TEntity> {
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
      id: 'deleteSelected',
      permission: options.authority?.delete,
      danger: true,
      visible: (ctx) => ctx.extras.titleActionsEnabled !== false,
      enabled: (ctx) =>
        ctx.selectedItems.length > 0 &&
        typeof (options.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
      label: (ctx) => withCount(options.locale.deleteSelected, ctx.selectedItems.length),
      icon: () => renderIconFont('loncra-archive-x'),
      run: (ctx) => options.remove(ctx.selectedItems),
    },
  ]
}

export interface DefaultItemActionsOptions<TEntity> {
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
      id: 'edit',
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
      id: 'detail',
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
      id: 'delete',
      permission: options.authority?.delete,
      danger: true,
      enabled: () =>
        typeof (options.service as BasicCrudService<TBody, TEntity, TId>).delete === 'function',
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

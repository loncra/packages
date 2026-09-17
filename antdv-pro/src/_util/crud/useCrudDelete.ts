import type {Ref} from 'vue'
import {nextTick} from 'vue'
import {type BasicCrudService, type BasicIdMetadata, type RestResult, SYSTEM_CONSTANT,} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'
import {withCount} from '../format'

export interface ConfirmModalLike {
  confirm: (options: {title: string; content: string; onOk: () => void | Promise<void>}) => void
}

export interface MessageLike {
  success: (content: string) => void
  error: (content: string) => void
}

export interface UseCrudDeleteOptions<
    TBody extends BasicIdMetadata<TId>,
    TEntity extends TBody,
    TId,
> {
  service: unknown
  locale: () => CrudLocale
  modal: ConfirmModalLike
  message: MessageLike
  refresh: () => Promise<void> | void
  onDeleted?: (records: TEntity[]) => void | Promise<void>
  loading?: Ref<boolean>
}

/**
 * 服务以 `unknown` 传入，可能是只读的 Search 系列 Service（没有 delete）。
 */
export function isDeletableService<TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId>(
  service: unknown,
): service is BasicCrudService<TBody, TEntity, TId> {
  return typeof (service as BasicCrudService<TBody, TEntity, TId> | null)?.delete === 'function'
}

export function useCrudDelete<TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId>(
  options: UseCrudDeleteOptions<TBody, TEntity, TId>,
) {
  function remove(records: TEntity[]) {
    if (records.length === 0) {
      return
    }
    const locale = options.locale()
    const content =
      records.length === 1
        ? locale.deleteConfirmSingle
        : withCount(locale.deleteConfirmBatch, records.length)
    options.modal.confirm({
      title: locale.deleteConfirmTitle,
      content,
      onOk: () => doDelete(records),
    })
  }

  async function doDelete(records: TEntity[]) {
    if (!isDeletableService<TBody, TEntity, TId>(options.service)) {
      return
    }
    const service = options.service
    if (options.loading) {
      options.loading.value = true
    }
    try {
      const result:RestResult<void> = await service.delete(records.map((r) => r[SYSTEM_CONSTANT.ID_NAME] as TId))

      options.message.success(result.message)
      await options.onDeleted?.(records)
    } catch (e) {
      options.message.error(e instanceof Error ? e.message : String(e))
    } finally {
      if (options.loading) {
        options.loading.value = false
      }
    }
    await nextTick()
    // 删除已经成功，无论后处理成败都要刷新
    await options.refresh()
  }

  return {remove, doDelete}
}

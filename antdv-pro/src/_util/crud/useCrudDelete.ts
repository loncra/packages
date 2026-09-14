import type {Ref} from 'vue'
import {
  type BasicCrudService,
  type BasicIdMetadata,
  type RestResult,
  SYSTEM_CONSTANT,
} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'

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
        : locale.deleteConfirmBatch.replace('{count}', String(records.length))
    options.modal.confirm({
      title: locale.deleteConfirmTitle,
      content,
      onOk: () => doDelete(records),
    })
  }

  async function doDelete(records: TEntity[]) {
    const service = options.service as BasicCrudService<TBody, TEntity, TId>
    if (typeof service.delete !== 'function') {
      return
    }
    // 缺陷 3：原实现只在 finally 置 false，从未置 true
    if (options.loading) {
      options.loading.value = true
    }
    try {
      const result: RestResult<void> = await service.delete(
        // 缺陷 5：原实现硬编码 r.id
        records.map((r) => r[SYSTEM_CONSTANT.ID_NAME] as TId),
      )
      options.message.success(result.message)
      await options.onDeleted?.(records)
      await options.refresh()
    } catch (e) {
      options.message.error(e instanceof Error ? e.message : String(e))
    } finally {
      if (options.loading) {
        options.loading.value = false
      }
    }
  }

  return {remove, doDelete}
}

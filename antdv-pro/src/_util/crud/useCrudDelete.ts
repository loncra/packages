import type {Ref} from 'vue'
import {type BasicCrudService, type BasicIdMetadata, type RestResult, SYSTEM_CONSTANT,} from '@loncra/client/commons'
import type {CrudLocale} from '../../locale'
import {withCount} from '../format'

/**
 * 服务以 `unknown` 传入，可能是只读的 Search 系列 Service（没有 delete）。
 */
export function isDeletableService<TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId>(
  service: unknown,
): service is BasicCrudService<TBody, TEntity, TId> {
  return typeof (service as BasicCrudService<TBody, TEntity, TId> | null)?.delete === 'function'
}

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
    // 缺陷 3：原实现只在 finally 置 false，从未置 true
    if (options.loading) {
      options.loading.value = true
    }
    try {
      let result: RestResult<void>
      // 缺陷 9：try 只包删除本身。原实现把 success 提示、onDeleted、refresh
      // 一起包住，导致「删除已成功、后处理抛错」被报成删除失败（且 success
      // 与 error 两条矛盾提示先后弹出），refresh 还会被整段跳过、列表留在陈旧数据上。
      try {
        result = await service.delete(
          // 缺陷 5：原实现硬编码 r.id
          records.map((r) => r[SYSTEM_CONSTANT.ID_NAME] as TId),
        )
      } catch (e) {
        options.message.error(e instanceof Error ? e.message : String(e))
        return
      }

      options.message.success(result.message)
      try {
        await options.onDeleted?.(records)
      } catch (e) {
        options.message.error(e instanceof Error ? e.message : String(e))
      }
      // 删除已经成功，无论后处理成败都要刷新
      await options.refresh()
    } finally {
      if (options.loading) {
        options.loading.value = false
      }
    }
  }

  return {remove, doDelete}
}

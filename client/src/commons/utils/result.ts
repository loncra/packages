import {HTTP_SUCCESS_EXECUTE_CODES} from '../constants/system.ts'
import type {RestResult} from '../domain/common.ts'

/**
 * 业务是否成功（HTTP 200 + `executeCode` 在成功码里）。
 *
 * 全平台只有这一份实现：宿主 `@/requests`、`@loncra/antdv-pro` 的
 * `_util/uploadFile.ts` / `file-editor/useFileEditor.ts` 都从这里走。
 */
export function isBusinessSuccess<T>(result: RestResult<T>): boolean {
  return (
    result.status === 200 &&
    (HTTP_SUCCESS_EXECUTE_CODES as readonly string[]).includes(result.executeCode)
  )
}

/** 同上，并且**收窄**到带 `data` 的结果（省掉调用方自己的 `result.data !== undefined` 判断） */
export function isResultSuccess<T>(
  result: RestResult<T> | null | undefined,
): result is RestResult<T> & {data: T} {
  return !!result && isBusinessSuccess(result) && result.data !== undefined
}

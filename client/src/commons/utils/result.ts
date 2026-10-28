import {HTTP_SUCCESS_EXECUTE_CODES} from '../constants/system.ts'
import type {RestResult} from '../domain/common.ts'

export function isBusinessSuccess<T>(result: RestResult<T>): boolean {
  return (
    result.status === 200 &&
    (HTTP_SUCCESS_EXECUTE_CODES as readonly string[]).includes(result.executeCode)
  )
}

export function isResultSuccess<T>(
  result: RestResult<T> | null | undefined,
): result is RestResult<T> & {data: T} {
  return !!result && isBusinessSuccess(result) && result.data !== undefined
}

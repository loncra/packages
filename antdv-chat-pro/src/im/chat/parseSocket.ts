import type {RestResult} from '@loncra/client/commons'

export function parseSocketRestPayload<T>(payload: unknown): RestResult<T> {
  return typeof payload === 'string' ? JSON.parse(payload) : (payload as RestResult<T>)
}

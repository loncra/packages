import type {AgentStreamTransport} from '@loncra/client/ai'
import {XRequest} from '@antdv-next/x-sdk'

export function createXAgentStreamTransport(): AgentStreamTransport {
  return {
    open(url, headers, handlers) {
      const request = XRequest<Record<string, never>, {data?: string}>(url, {
        manual: true,
        headers,
        callbacks: {
          onUpdate: (chunk) => {
            if (chunk?.data != null) {
              handlers.onUpdate(String(chunk.data))
            }
          },
          onSuccess: () => handlers.onSuccess(),
          onError: (error) => handlers.onError(error),
        },
      })
      request.run()
      return {abort: () => request.abort()}
    },
  }
}

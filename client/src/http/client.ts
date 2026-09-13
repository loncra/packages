import type {ClientConfig, HttpClient} from './types.ts'

let current: ClientConfig | undefined

export function createClient(config: ClientConfig): ClientConfig {
  current = config
  return config
}

export function getClient(): ClientConfig {
  if (!current) {
    throw new Error('@loncra/client: 使用 Service 前必须先 createClient()')
  }
  return current
}

export function tryGetClient(): ClientConfig | undefined {
  return current
}

export function http(): HttpClient {
  return getClient().http
}

/** 单体 `/api`，微服务 `/api/{module}`。须在 createClient 之后调用（Service 用 getter）。 */
export function modulePrefix(moduleName: string): string {
  const {runtimeMode} = getClient()
  return '/api' + (runtimeMode === 'MICROSERVICE' ? `/${moduleName}` : '')
}

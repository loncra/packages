import type {ClientConfig, HttpClient} from './types.ts'

let current: ClientConfig | undefined

export function createClient(config: ClientConfig): ClientConfig {
  current = config
  return config
}

export function configureClient(config: ClientConfig): ClientConfig {
  return createClient(config)
}

export function getClient(): ClientConfig {
  if (!current) {
    throw new Error(
      '@loncra/client: 使用 Service 前必须先 createClient()。若在应用层，请确认 LClientProvider 已包裹且请求未早于它发出',
    )
  }
  return current
}

export function tryGetClient(): ClientConfig | undefined {
  return current
}

export function http(): HttpClient {
  return getClient().http
}

export function modulePrefix(moduleName: string): string {
  const {runtimeMode} = getClient()
  return '/api' + (runtimeMode === 'MICROSERVICE' ? `/${moduleName}` : '')
}

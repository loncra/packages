import type {ClientConfig, HttpClient} from './types.ts'

let current: ClientConfig | undefined

export function createClient(config: ClientConfig): ClientConfig {
  current = config
  return config
}

/**
 * 声明式配置入口（幂等，重复调用即覆盖）。
 * 供 LClientProvider 这类组件化用法调用：组件 setup 中执行，早于任何请求。
 */
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

/**
 * 单体 `/api`，微服务 `/api/{module}`。
 *
 * 依赖 `getClient()` ⇒ **必须在 createClient 之后调用**。各具体 Service 把它放在
 * `super(() => XxxService.SERVICE_URL)` 的**取值函数**里（请求时才求值），
 * 所以 `new XxxService()` 本身是纯的（见 `DetailSearchRestfulService.resolvedBaseUrl`）。
 */
export function modulePrefix(moduleName: string): string {
  const {runtimeMode} = getClient()
  return '/api' + (runtimeMode === 'MICROSERVICE' ? `/${moduleName}` : '')
}

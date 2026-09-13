import type {HttpClient, HttpRequest} from '../http'

/**
 * 把已配好拦截器的 Axios 实例接到 HttpClient。
 * axios 不进 @loncra/client 的 dependencies，由 App 安装。
 */
export function createAxiosHttpClient(instance: {
  request: (config: any) => Promise<any>
}): HttpClient {
  return {
    request<T>(req: HttpRequest): Promise<T> {
      return instance.request({
        url: req.url,
        method: req.method,
        data: req.data,
        params: req.params,
        headers: req.headers,
        ...(req.extra ?? {}),
      }) as Promise<T>
    },
  }
}

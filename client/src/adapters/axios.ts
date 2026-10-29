import type {HttpClient, HttpRequest} from '../http'

export function createAxiosHttpClient(instance: {
  request: (config: any) => Promise<any>
  defaults?: {baseURL?: string}
}): HttpClient {
  return {
    baseUrl: instance.defaults?.baseURL,
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

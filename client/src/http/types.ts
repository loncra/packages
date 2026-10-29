export type RuntimeMode = 'MONOLITH' | 'MICROSERVICE'

export interface HttpRequest {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
  headers?: Record<string, string>
  params?: Record<string, unknown> | URLSearchParams
  bodyType?: 'json' | 'form' | 'formData' | 'raw'
  extra?: object
}

export interface HttpClient {
  request<T>(req: HttpRequest): Promise<T>
  readonly baseUrl?: string
}

export type FormValueConvert = (key: string, value: unknown) => unknown

export interface ClientConfig {
  http: HttpClient
  runtimeMode: RuntimeMode
  getAccessToken?: () => string | null | undefined
  resourcePath?: string
  openAttachmentUrl?: (url: string) => void
  formValueConvert?: FormValueConvert
  uploadBlockSize?: number
}

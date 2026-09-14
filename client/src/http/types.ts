export type RuntimeMode = 'MONOLITH' | 'MICROSERVICE'

export interface HttpRequest {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  data?: unknown
  headers?: Record<string, string>
  params?: Record<string, unknown> | URLSearchParams
  bodyType?: 'json' | 'form' | 'formData' | 'raw'
  /** 适配器透传（如 axios onUploadProgress） */
  extra?: object
}

export interface HttpClient {
  request<T>(req: HttpRequest): Promise<T>
}

export type FormValueConvert = (key: string, value: unknown) => unknown

export interface ClientConfig {
  http: HttpClient
  runtimeMode: RuntimeMode
  getAccessToken?: () => string | null | undefined
  resourcePath?: string
  openUrl?: (url: string) => void
  /** 登录请求头名，对应管理端 VITE_APP_HEADER_AUTHENTICATION_TYPE_NAME */
  authenticationTypeHeaderName?: string
  /** 表单编码值转换（Dayjs、枚举对象等由 App 注入） */
  formValueConvert?: FormValueConvert
  /** 超过该字节走分片；未设或非有限数字则始终单文件 */
  uploadBlockSize?: number
}

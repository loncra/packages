export interface TianaiCaptchaOptions {
  baseUrl: string
  token: string
  success: (result: {data: string}) => void
  cancel: () => void
}

export interface TianaiCaptchaInstance {
  show(): void
  hide(): void
}

export interface TianaiCaptchaConstructor {
  new(options: TianaiCaptchaOptions): TianaiCaptchaInstance
}

declare global {
  const TianaiCaptcha: TianaiCaptchaConstructor | undefined
}

export {}

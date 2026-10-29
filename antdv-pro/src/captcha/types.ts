import type {CaptchaGenerationResult, CaptchaInterceptToken, CaptchaToken} from '@loncra/client/commons'

export type {CaptchaGenerationResult, CaptchaInterceptToken, CaptchaToken}

export interface CaptchaSendResult {
  token: CaptchaToken
  captchaParams: Record<string, unknown>
  generateResult: CaptchaGenerationResult
}

export interface BehaviorVerifier {
  supports(type: string): boolean
  verify(token: CaptchaInterceptToken): Promise<string | undefined>
}

export interface CaptchaSendButtonClasses {
  timer?: string
}

export interface CaptchaSendButtonStyles {
  timer?: Record<string, string | number>
}

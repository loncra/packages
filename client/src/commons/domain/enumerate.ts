import type {NameValueEnumMetadata, TimeProperties} from './common.ts'
import type {CAPTCHA_TOKEN_TYPE} from '../enumerate.ts'

export type EnumBucketsResponseBody = Record<
  string,
  Record<string, NameValueEnumMetadata<number | string>[]>
>

export type EnumBucketsRequestBody = Record<
  string,
  {
    id: string
    value?: string[]
  }[]
>

export interface CaptchaInterceptToken {
  type: string
  args: Record<string, unknown>
  id: string
  creationTime: number
  token: {
    name: string
    expiresTime: TimeProperties
  }
  tokenParamName: string
}

export interface CaptchaToken extends CaptchaInterceptToken {
  interceptToken?: CaptchaInterceptToken
}

export interface CaptchaGenerationResult {
  codeLength: number
  expired: TimeProperties
}

export type CaptchaTokenType =
  | typeof CAPTCHA_TOKEN_TYPE.SMS
  | typeof CAPTCHA_TOKEN_TYPE.EMAIL
  | typeof CAPTCHA_TOKEN_TYPE.TIANAI

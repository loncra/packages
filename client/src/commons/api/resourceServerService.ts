import {SYSTEM_MODULE_NAME} from '../constants/system.ts'
import type {IdValueMetadata, RestResult} from '../domain/common.ts'
import type {DataDictionaryMetadata} from '../domain/dictionary.ts'
import type {
  CaptchaGenerationResult,
  CaptchaInterceptToken,
  CaptchaSendOutcome,
  CaptchaToken,
  CaptchaTokenType,
  EnumBucketsRequestBody,
  EnumBucketsResponseBody,
} from '../domain/enumerate.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'
import {RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE} from '../../resource/enumerate.ts'
import {http, modulePrefix} from '../../http'

export class ResourceServerService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER)
  }

  static get GET_SERVICE_ENUMERATE_URL(): string {
    return ResourceServerService.BASE_URL + '/enumerate'
  }

  static get CAPTCHA_GENERATE_GENERATE_TOKEN_URL(): string {
    return ResourceServerService.BASE_URL + '/captcha/generateToken'
  }

  static get CAPTCHA_GENERATE_CAPTCHA_TOKEN_URL(): string {
    return ResourceServerService.BASE_URL + '/captcha/generateCaptcha'
  }

  static get GET_DATA_DICTIONARIES_BY_TYPE_IDS_URL(): string {
    return ResourceServerService.BASE_URL + '/data/dictionary/groupByTypIds'
  }

  static get GET_DATA_DICTIONARIES_BY_CODES_URL(): string {
    return ResourceServerService.BASE_URL + '/data/dictionary/groupByCodes'
  }

  static getServiceEnumerates(
    filter: EnumBucketsRequestBody,
  ): Promise<RestResult<EnumBucketsResponseBody>> {
    return http().request({
      url: ResourceServerService.GET_SERVICE_ENUMERATE_URL,
      method: 'POST',
      data: filter,
      bodyType: 'json',
    })
  }

  static getServiceEnumerate<I, V>(
    service: string,
    enumerateName: string,
  ): Promise<RestResult<IdValueMetadata<I, V>[]>> {
    return http().request({
      url: ResourceServerService.GET_SERVICE_ENUMERATE_URL + '/' + service + '/' + enumerateName,
      method: 'GET',
    })
  }

  static findDataDictionariesByTypeIds(
    typeIds: number[],
  ): Promise<RestResult<Record<number, DataDictionaryMetadata[]>>> {
    return http().request({
      url: ResourceServerService.GET_DATA_DICTIONARIES_BY_TYPE_IDS_URL,
      method: 'POST',
      data: formUrlEncoded({typeIds}),
      bodyType: 'form',
    })
  }

  static findDataDictionariesByCodes(
    codes: string[],
  ): Promise<RestResult<Record<string, DataDictionaryMetadata[]>>> {
    return http().request({
      url: ResourceServerService.GET_DATA_DICTIONARIES_BY_CODES_URL,
      method: 'POST',
      data: formUrlEncoded({codes}),
      bodyType: 'form',
    })
  }

  static generateCaptchaToken(type: CaptchaTokenType): Promise<RestResult<CaptchaToken>> {
    return http().request({
      url: ResourceServerService.CAPTCHA_GENERATE_GENERATE_TOKEN_URL,
      method: 'GET',
      params: formUrlEncoded({type}),
    })
  }

  static generateCaptcha(
    params: Record<string, unknown>,
  ): Promise<RestResult<Record<string, unknown>>> {
    return http().request({
      url: ResourceServerService.CAPTCHA_GENERATE_CAPTCHA_TOKEN_URL,
      method: 'POST',
      data: formUrlEncoded(params),
      bodyType: 'form',
    })
  }

  static createGenerateTokenParam(
    captchaToken: CaptchaToken,
    append?: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      captchaType: captchaToken.type,
      [captchaToken.tokenParamName]: captchaToken.token.name,
      ...append,
    }
  }

  static async sendCaptcha(
    type: CaptchaTokenType,
    append?: Record<string, unknown>,
  ): Promise<CaptchaSendOutcome> {
    const tokenResult = await this.generateCaptchaToken(type)
    if (!tokenResult.data) {
      throw new Error(tokenResult.message)
    }
    const token = tokenResult.data
    if (!token.interceptToken) {
      return this.completeCaptchaGenerate(token, this.createGenerateTokenParam(token, append))
    }
    return {kind: 'intercepted', token, interceptToken: token.interceptToken}
  }

  static async confirmCaptchaSend(
    token: CaptchaToken,
    interceptToken: CaptchaInterceptToken,
    verifyResult: string,
    append?: Record<string, unknown>,
  ): Promise<CaptchaSendOutcome> {
    const interceptParams = this.createGenerateTokenParam(interceptToken, {
      [(interceptToken.args.post as {captchaParamName: string}).captchaParamName]: verifyResult,
    })
    const params = this.createGenerateTokenParam(token, append ?? {})
    return this.completeCaptchaGenerate(token, {...interceptParams, ...params})
  }

  private static async completeCaptchaGenerate(
    token: CaptchaToken,
    params: Record<string, unknown>,
  ): Promise<CaptchaSendOutcome> {
    const result = await this.generateCaptcha(params)
    return {kind: 'generated', token, generateResult: result.data as unknown as CaptchaGenerationResult}
  }

  static sendEmailCaptcha(email: string, messageType: string): Promise<CaptchaSendOutcome> {
    return this.sendCaptcha(RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL, {email, messageType})
  }

  static sendPhoneNumberCaptcha(phoneNumber: string, messageType: string): Promise<CaptchaSendOutcome> {
    return this.sendCaptcha(RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.SMS, {phoneNumber, messageType})
  }
}

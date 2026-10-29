import {type CaptchaToken, type CaptchaTokenType, ResourceServerService} from '@loncra/client/commons'
import type {BehaviorVerifier, CaptchaSendResult} from './types.ts'
import {createTianaiBehaviorVerifier} from './behaviorVerifiers.ts'

export function useCaptchaSend(options?: {verifier?: BehaviorVerifier}) {
  const verifiers: BehaviorVerifier[] = [options?.verifier ?? createTianaiBehaviorVerifier()]

  function verifierFor(type: string): BehaviorVerifier {
    const found = verifiers.find((item) => item.supports(type))
    if (!found) {
      throw new Error(`no behavior verifier for captcha type: ${type}`)
    }
    return found
  }

  function toSendResult(token: CaptchaToken, generateResult: CaptchaSendResult['generateResult']): CaptchaSendResult {
    return {
      token,
      captchaParams: ResourceServerService.createGenerateTokenParam(token),
      generateResult,
    }
  }

  async function send(type: CaptchaTokenType, append?: Record<string, unknown>): Promise<CaptchaSendResult | undefined> {
    const outcome = await ResourceServerService.sendCaptcha(type, append)
    if (outcome.kind === 'generated') {
      return toSendResult(outcome.token, outcome.generateResult)
    }
    const verifier = verifierFor(outcome.interceptToken.type)
    const verifyResult = await verifier.verify(outcome.interceptToken)
    if (verifyResult === undefined) {
      return undefined
    }
    const confirmed = await ResourceServerService.confirmCaptchaSend(
      outcome.token,
      outcome.interceptToken,
      verifyResult,
      append,
    )
    if (confirmed.kind !== 'generated') {
      throw new Error('captcha confirm did not generate')
    }
    return toSendResult(confirmed.token, confirmed.generateResult)
  }

  return {send, verifiers}
}

export function buildCaptchaSubmitParams(
  token: CaptchaToken,
  captchaValue: string,
  append?: Record<string, unknown>,
): Record<string, unknown> {
  return ResourceServerService.createGenerateTokenParam(token, {
    [(token.args.post as {captchaParamName: string}).captchaParamName]: captchaValue,
    ...append,
  })
}

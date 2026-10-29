import type {CaptchaToken} from '@loncra/client/commons'
import {ResourceServerService} from '@loncra/client/commons'
import {createTianaiBehaviorVerifier} from './behaviorVerifiers.ts'
import type {BehaviorVerifier} from './types.ts'

export function useBehaviorCaptcha(options?: {verifier?: BehaviorVerifier}) {
  const verifiers: BehaviorVerifier[] = [options?.verifier ?? createTianaiBehaviorVerifier()]

  function verifierFor(type: string): BehaviorVerifier {
    const found = verifiers.find((item) => item.supports(type))
    if (!found) {
      throw new Error(`no behavior verifier for captcha type: ${type}`)
    }
    return found
  }

  async function run(token: CaptchaToken): Promise<Record<string, unknown> | undefined> {
    if (token.interceptToken) {
      const verifier = verifierFor(token.interceptToken.type)
      const verifyResult = await verifier.verify(token.interceptToken)
      if (verifyResult === undefined) {
        return undefined
      }
      return ResourceServerService.createGenerateTokenParam(token, {
        [(token.interceptToken.args.post as {captchaParamName: string}).captchaParamName]: verifyResult,
      })
    }
    if (verifierFor(token.type)) {
      const verifyResult = await verifierFor(token.type).verify(token)
      if (verifyResult === undefined) {
        return undefined
      }
      return ResourceServerService.createGenerateTokenParam(token, {
        [(token.args.post as {captchaParamName: string}).captchaParamName]: verifyResult,
      })
    }
    return ResourceServerService.createGenerateTokenParam(token)
  }

  return {run}
}

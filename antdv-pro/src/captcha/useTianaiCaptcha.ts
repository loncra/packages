import {modulePrefix} from '@loncra/client/http'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {loadScript} from '../_util/loadResource.ts'
import type {TianaiCaptchaInstance} from './tianai.d.ts'

export function useTianaiCaptcha() {
  async function create(
    token: {
      type: string
      token: {name: string}
      args: {generate: {jsUrl: string}}
    },
    handlers: {
      success: (result: {data: string}) => void
      cancel: () => void
    },
  ): Promise<TianaiCaptchaInstance | undefined> {
    await loadScript(String(token.type), token.args.generate.jsUrl)
    if (!TianaiCaptcha) {
      return undefined
    }
    return new TianaiCaptcha({
      baseUrl: modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER),
      token: token.token.name,
      success: handlers.success,
      cancel: handlers.cancel,
    })
  }

  return {create}
}

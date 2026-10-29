import {modulePrefix} from '@loncra/client/http'
import {SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import type {BehaviorVerifier} from './types.ts'
import {loadScript} from '../_util/loadResource.ts'
import type {TianaiCaptchaInstance} from './tianai.d.ts'

export function createTianaiBehaviorVerifier(): BehaviorVerifier {
  return {
    supports: (type) => type === 'tianai',
    verify(token) {
      return new Promise<string | undefined>((resolve, reject) => {
        loadScript(String(token.type), (token.args.generate as {jsUrl: string}).jsUrl)
          .then(() => {
            if (!TianaiCaptcha) {
              reject(new Error('tianai captcha script unavailable'))
              return
            }
            const instance: TianaiCaptchaInstance = new TianaiCaptcha({
              baseUrl: modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER),
              token: token.token.name,
              success: (result) => {
                instance.hide()
                resolve(result.data)
              },
              cancel: () => resolve(undefined),
            })
            instance.show()
          })
          .catch(reject)
      })
    },
  }
}

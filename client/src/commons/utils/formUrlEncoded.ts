import {type FormValueConvert, tryGetClient} from '../../http'

/**
 * 把对象编成 application/x-www-form-urlencoded。
 * 值怎么转由调用方决定：单次传入 valueConvert，或 createClient({ formValueConvert })。
 */
export function formUrlEncoded(
  json: Record<string, unknown>,
  ignoreProperties?: string | string[],
  valueConvert?: FormValueConvert,
): URLSearchParams {
  const param = new URLSearchParams()
  const ignore = typeof ignoreProperties === 'string'
    ? [ignoreProperties]
    : ignoreProperties ?? []
  const injected = tryGetClient()?.formValueConvert

  for (const key of Object.keys(json)) {
    if (ignore.includes(key)) {
      continue
    }
    let val = json[key]
    if (val === undefined || val === null) {
      continue
    }
    if (valueConvert) {
      val = valueConvert(key, val)
    }
    if (injected) {
      val = injected(key, val)
    }
    if (val === undefined || val === null) {
      continue
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        param.append(key, String(item))
      }
    } else {
      param.append(key, String(val))
    }
  }

  return param
}

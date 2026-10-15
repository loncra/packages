import {type FormValueConvert, tryGetClient} from '../../http'

function normalizeIgnore(ignoreProperties?: string | string[]): string[] {
  return typeof ignoreProperties === 'string'
    ? [ignoreProperties]
    : ignoreProperties ?? []
}

function collectConverters(valueConvert?: FormValueConvert): FormValueConvert[] {
  const converters: FormValueConvert[] = []
  if (valueConvert) {
    converters.push(valueConvert)
  }
  const injected = tryGetClient()?.formValueConvert
  if (injected) {
    converters.push(injected)
  }
  return converters
}

function resolveFormValue(key: string, val: unknown, converters: FormValueConvert[]): unknown {
  let resolved = val
  for (const convert of converters) {
    resolved = convert(key, resolved)
    if (resolved === undefined || resolved === null) {
      return undefined
    }
  }
  return resolved
}

function appendFormValue(param: URLSearchParams, key: string, val: unknown): void {
  if (Array.isArray(val)) {
    for (const item of val) {
      param.append(key, String(item))
    }
    return
  }
  param.append(key, String(val))
}

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
  const ignore = normalizeIgnore(ignoreProperties)
  const converters = collectConverters(valueConvert)

  for (const key of Object.keys(json)) {
    if (ignore.includes(key)) {
      continue
    }
    const raw = json[key]
    if (raw === undefined || raw === null) {
      continue
    }
    const val = resolveFormValue(key, raw, converters)
    if (val === undefined || val === null) {
      continue
    }
    appendFormValue(param, key, val)
  }

  return param
}

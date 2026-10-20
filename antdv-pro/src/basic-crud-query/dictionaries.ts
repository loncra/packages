import type {RestResult} from '@loncra/client/commons'
import {
  ResourceServerService,
  type EnumBucketsRequestBody,
  type EnumBucketsResponseBody,
} from '@loncra/client/resource'
import type {EnumBucketRequest, PageDictionaries} from './types'

function compact(values?: (string | undefined)[]) {
  return [...new Set((values ?? []).filter((value): value is string => !!value))]
}

export async function fetchEnumBuckets(
  requests?: EnumBucketRequest[],
): Promise<EnumBucketsResponseBody> {
  const body: EnumBucketsRequestBody = {}
  for (const {module, ids} of requests ?? []) {
    const list = compact(ids)
    if (list.length > 0) {
      body[module] = [...(body[module] ?? []), ...list.map((id) => ({id}))]
    }
  }
  if (Object.keys(body).length === 0) {
    return {}
  }
  const result: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates(body)
  return result.data ?? {}
}

export async function fetchDataDictionaries(
  codes?: (string | undefined)[],
): Promise<PageDictionaries> {
  const dictionaryCodes = compact(codes)
  if (dictionaryCodes.length === 0) {
    return {}
  }
  const result = await ResourceServerService.findDataDictionariesByCodes(dictionaryCodes)
  return result.data ?? {}
}

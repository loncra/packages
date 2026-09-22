import type {RestResult} from '@loncra/client/commons'
import {
  ResourceServerService,
  type EnumBucketsRequestBody,
  type EnumBucketsResponseBody,
} from '@loncra/client/resource'
import type {EnumBucketRequest, PageDictionaries} from './types'

/** 去重 + 丢掉空值（声明里的 id/code 常是宿主常量和 undefined 混着写） */
function compact(values?: (string | undefined)[]) {
  return [...new Set((values ?? []).filter((value): value is string => !!value))]
}

/**
 * 拉枚举桶（声明里的 `list.enums`）。走 client 直连、不经宿主的 `@/apis`：
 * 这是通用系统数据，不属于某个宿主的业务。
 *
 * **必须给模块**：桶 = 模块 + 枚举 id 索引（`resource-server` / `auth-server` / `ai-server` /
 * `message-server` 各有一套），只给 id 是查不到的；一组都没给时一个请求都不发。
 */
export async function fetchEnumBuckets(requests?: EnumBucketRequest[]): Promise<EnumBucketsResponseBody> {
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
  const result: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates(body)
  return result.data ?? {}
}

/**
 * 拉数据字典（声明里的 `list.dictionaryCodes`）。**原样收下不归一化**：
 * `valueType` / `metadata` / `children` 后面都还要用。
 */
export async function fetchDataDictionaries(codes?: (string | undefined)[]): Promise<PageDictionaries> {
  const dictionaryCodes = compact(codes)
  if (dictionaryCodes.length === 0) {
    return {}
  }
  const result = await ResourceServerService.findDataDictionariesByCodes(dictionaryCodes)
  return result.data ?? {}
}

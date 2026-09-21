import type {RestResult} from '@loncra/client/commons'
import {
  ResourceServerService,
  type DataDictionaryMetadata,
  type EnumBucketsRequestBody,
  type EnumBucketsResponseBody,
} from '@loncra/client/resource'

/**
 * 枚举桶：**模块 → 枚举 id → `{name, value}[]`**（后端 `EnumBucketsResponseBody` 原样收下）。
 * 桶按「模块 + 枚举 id」两者索引，单给一个 id 是查不到的 —— 所以下面两个类型都带 `module`。
 */
export type PageEnums = EnumBucketsResponseBody

/** 一个枚举桶的定位：模块 + 枚举 id（声明里的 `enumRef` 用它） */
export interface EnumRef {
  module: string
  id: string
}

/** 要加载的一组枚举桶：模块 + 该模块下的枚举 id 列表（对应后端 `EnumBucketsRequestBody` 的一项） */
export interface EnumBucketRequest {
  module: string
  ids: string[]
}

/** 数据字典：字典 code → 字典项（client 的原样类型，含 code/name/valueType/metadata/children） */
export type PageDicts = Record<string, DataDictionaryMetadata[]>

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
export async function fetchEnumBuckets(requests?: EnumBucketRequest[]): Promise<PageEnums> {
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
 * 拉数据字典（声明里的 `list.dicts`）。**原样收下不归一化**：
 * `valueType` / `metadata` / `children` 后面都还要用。
 */
export async function fetchDataDicts(codes?: (string | undefined)[]): Promise<PageDicts> {
  const dictCodes = compact(codes)
  if (dictCodes.length === 0) {
    return {}
  }
  const result = await ResourceServerService.findDataDictionariesByCodes(dictCodes)
  return result.data ?? {}
}

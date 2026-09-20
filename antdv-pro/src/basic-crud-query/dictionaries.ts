import {SYSTEM_MODULE_NAME, type NameValueEnumMetadata, type RestResult} from '@loncra/client/commons'
import {
  ResourceServerService,
  type DataDictionaryMetadata,
  type EnumBucketsResponseBody,
} from '@loncra/client/resource'

/** 枚举桶：id → `{name, value}[]` */
export type PageEnums = Record<string, NameValueEnumMetadata<number | string>[]>

/** 数据字典：字典 code → 字典项（client 的原样类型，含 code/name/valueType/metadata/children） */
export type PageDicts = Record<string, DataDictionaryMetadata[]>

/** 去重 + 丢掉空值（声明里的 id/code 常是宿主常量和 undefined 混着写） */
function compact(values?: (string | undefined)[]) {
  return [...new Set((values ?? []).filter((value): value is string => !!value))]
}

/**
 * 拉枚举桶（声明里的 `list.enums`）。走 client 直连、不经宿主的 `@/apis`：
 * 这是通用系统数据，不属于某个宿主的业务。id 为空时一个请求都不发。
 */
export async function fetchEnumBuckets(ids?: (string | undefined)[]): Promise<PageEnums> {
  const enumIds = compact(ids)
  if (enumIds.length === 0) {
    return {}
  }
  const result: RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({
    [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: enumIds.map((id) => ({id})),
  })
  return (result.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}) as PageEnums
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

import {onMounted, ref} from 'vue'
import {SYSTEM_MODULE_NAME, type RestResult} from '@loncra/client/commons'
import {ResourceServerService, type EnumBucketsResponseBody} from '@loncra/client/resource'
import type {PageDicts, PageEnums} from './types'

/**
 * 挂载时一次性加载声明里用到的**系统字典数据**：枚举桶（`list.enums`）+ 数据字典（`list.dicts`）。
 * 两者都走 client 直连（不经过宿主的 `@/apis` 包装）——它们是通用数据，不属于某个宿主的业务；
 * 宿主要加统一策略（如验证码弹层）应当在 client 的 http 层做。
 *
 * 都是系统字典，页面里没有让它变化的时机，所以只返回数据、不给 refresh。
 */
export function usePageEnums(ids?: (string | undefined)[], dictCodes?: (string | undefined)[]) {
  const buckets = ref<PageEnums>({})
  const dicts = ref<PageDicts>({})
  const enumIds = [...new Set((ids ?? []).filter((id): id is string => !!id))]
  const codes = [...new Set((dictCodes ?? []).filter((code): code is string => !!code))]

  onMounted(async () => {
    await Promise.all([
      (async () => {
        if (enumIds.length === 0) {
          return
        }
        const result: RestResult<EnumBucketsResponseBody> =
          await ResourceServerService.getServiceEnumerates({
            [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: enumIds.map((id) => ({id})),
          })
        buckets.value = (result.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}) as PageEnums
      })(),
      (async () => {
        if (codes.length === 0) {
          return
        }
        // 原样收下字典项，不归一化：valueType / metadata / children 都还要用
        const result = await ResourceServerService.findDataDictionariesByCodes(codes)
        dicts.value = result.data ?? {}
      })(),
    ])
  })

  return {buckets, dicts}
}

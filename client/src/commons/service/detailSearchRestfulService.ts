import {http} from '../../http'
import {SYSTEM_CONSTANT} from '../constants/system.ts'
import type {BasicIdMetadata, DetailSearchService, FilterRequest, RestResult,} from '../domain/common.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'

/**
 * service 的 URL 来源：**取值函数**（推荐，请求时才求值）或字符串（等价"构造期求值"）。
 *
 * 具体 service 一律传函数：`super(() => XxxService.SERVICE_URL)`。
 */
export type BaseUrlSource = string | (() => string)

export class DetailSearchRestfulService<
  TEntity extends BasicIdMetadata<TId>,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
> implements DetailSearchService<TEntity, TId> {
  static readonly EXPORT_URL = '/export'

  constructor(protected readonly baseUrl: BaseUrlSource) {}

  /**
   * 真正发请求时才解析 URL（**这是本仓的硬要求**，2026-09-30 治根）。
   *
   * 为什么不能收"算好的字符串"：`SERVICE_URL` → `BASE_URL` → `modulePrefix()` → `getClient()`，
   * 而声明文件（`*.page.ts`）顶层就 `new XxxService()` —— 一旦那条链落进**首屏 eager 图**
   * （任何被入口静态引到、且最终 import 到声明文件的模块都算：布局、公共组件、工具……），
   * **构造期**就要 client ⇒ 报
   * `@loncra/client: 使用 Service 前必须先 createClient()`（该坑本仓踩过两次：
   * `UserExport` / `EnterpriseSetting`）。
   *
   * 包成函数之后：**`new` 是纯的**（不碰 client），URL 在第一次请求时才解析 ⇒ 谁在什么时候
   * import 这个模块都不会崩，**不必再靠"路由必须懒加载"这种调用方纪律去回避**
   * （路由侧已于 2026-09-30 统一改成按需加载，见 `routers/index.ts` 的说明；两条各自成立、互不依赖）。
   *
   * 传字符串仍然可用（原样返回，行为与改造前一致）—— 但**新写的 service 请一律给函数**。
   */
  protected get resolvedBaseUrl(): string {
    return typeof this.baseUrl === 'function' ? this.baseUrl() : this.baseUrl
  }

  exportData(filter: FilterRequest): Promise<RestResult<void>> {
    return http().request({
      url: this.resolvedBaseUrl + DetailSearchRestfulService.EXPORT_URL,
      method: 'POST',
      data: formUrlEncoded(filter as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  get(id: TId): Promise<RestResult<TEntity>> {
    return http().request({
      url: `${this.resolvedBaseUrl}/${id}`,
      method: 'GET',
    })
  }
}

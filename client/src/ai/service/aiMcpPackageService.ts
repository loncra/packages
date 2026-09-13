import {
  formUrlEncoded,
  type PageRequest,
  PageRestfulCrudService,
  type RestResult,
  SYSTEM_MODULE_NAME,
  type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {
  McpClientTransportMetadata,
  McpPackageEntity,
  McpPackageSavePayload,
  McpToolMetadata,
} from '../domain/mcp.ts'

export class AiMcpPackageService extends PageRestfulCrudService<
  McpPackageSavePayload,
  McpPackageEntity,
  TotalPage<McpPackageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get SERVICE_URL(): string {
    return AiMcpPackageService.BASE_URL + '/ai/mcp/package'
  }

  static get TOOLS_URL(): string {
    return AiMcpPackageService.SERVICE_URL + '/tools'
  }

  static get RELEASE_URL(): string {
    return AiMcpPackageService.SERVICE_URL + '/release'
  }

  static get REVOKE_URL(): string {
    return AiMcpPackageService.SERVICE_URL + '/revoke'
  }

  static get PAGE_ENABLED_ULR(): string {
    return AiMcpPackageService.SERVICE_URL + '/enabled'
  }

  constructor() {
    super(AiMcpPackageService.SERVICE_URL)
  }

  page(request: PageRequest): Promise<RestResult<TotalPage<McpPackageEntity>>> {
    return http().request({
      url: this.baseUrl,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  pageEnabled(request: PageRequest): Promise<RestResult<TotalPage<McpPackageEntity>>> {
    return http().request({
      url: AiMcpPackageService.PAGE_ENABLED_ULR,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  listTools(entity: McpClientTransportMetadata): Promise<RestResult<McpToolMetadata[]>> {
    return http().request({
      url: AiMcpPackageService.TOOLS_URL,
      method: 'POST',
      data: entity,
      bodyType: 'json',
    })
  }

  release(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AiMcpPackageService.RELEASE_URL,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  revoke(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AiMcpPackageService.REVOKE_URL,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }
}

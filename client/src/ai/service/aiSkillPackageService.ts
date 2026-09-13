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
    SkillPackageEntity,
    SkillPackageSavePayload,
    SkillPackageSnapshotPayload,
    SkillReleaseEntity,
} from '../domain/skill.ts'

export class AiSkillPackageService extends PageRestfulCrudService<
  SkillPackageSavePayload,
  SkillPackageEntity,
  TotalPage<SkillPackageEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get SERVICE_URL(): string {
    return AiSkillPackageService.BASE_URL + '/ai/skill/package'
  }

  static get RELEASE_URL(): string {
    return AiSkillPackageService.SERVICE_URL + '/release'
  }

  static get REVOKE_URL(): string {
    return AiSkillPackageService.SERVICE_URL + '/revoke'
  }

  static get REINGEST_ULR(): string {
    return AiSkillPackageService.SERVICE_URL + '/reingest'
  }

  static get PAGE_ENABLED_ULR(): string {
    return AiSkillPackageService.SERVICE_URL + '/enabled'
  }

  constructor() {
    super(AiSkillPackageService.SERVICE_URL)
  }

  page(request: PageRequest): Promise<RestResult<TotalPage<SkillPackageEntity>>> {
    return http().request({
      url: this.baseUrl,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  pageEnabled(request: PageRequest): Promise<RestResult<TotalPage<SkillPackageEntity>>> {
    return http().request({
      url: AiSkillPackageService.PAGE_ENABLED_ULR,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  release(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AiSkillPackageService.RELEASE_URL,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  revoke(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AiSkillPackageService.REVOKE_URL,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  reingest(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: AiSkillPackageService.REINGEST_ULR,
      method: 'POST',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  snapshot(id: number, body: SkillPackageSnapshotPayload): Promise<RestResult<number>> {
    return http().request({
      url: AiSkillPackageService.SERVICE_URL + '/' + id + '/snapshot',
      method: 'POST',
      data: body,
      bodyType: 'json',
    })
  }

  listReleases(packageId: number): Promise<RestResult<SkillReleaseEntity[]>> {
    return http().request({
      url: AiSkillPackageService.SERVICE_URL + '/release/' + packageId,
      method: 'GET',
    })
  }
}

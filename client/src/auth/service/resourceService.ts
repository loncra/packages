import {
    type FilterRequest,
    FindRestfulCrudService,
    formUrlEncoded,
    type RestResult,
    SYSTEM_CONSTANT,
    SYSTEM_MODULE_NAME,
    type TreeSortMetadata,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {ResourceEntity, ResourceSavePayload} from '../domain/resource.ts'

export class ResourceService extends FindRestfulCrudService<ResourceSavePayload, ResourceEntity> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return ResourceService.BASE_URL + '/resource'
  }

  static get SERVICE_SORT(): string {
    return ResourceService.SERVICE_URL + '/sort'
  }

  static get FIND_ENTERPRISE(): string {
    return ResourceService.SERVICE_URL + '/find/enterprise'
  }

  constructor() {
    super(ResourceService.SERVICE_URL)
  }

  sort(
    sorts: TreeSortMetadata<ResourceEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
  ): Promise<RestResult<void>> {
    return http().request({
      url: ResourceService.SERVICE_SORT,
      method: 'PUT',
      data: sorts,
      bodyType: 'json',
    })
  }

  findEnterprise(request: FilterRequest): Promise<RestResult<ResourceEntity[]>> {
    return http().request({
      url: ResourceService.FIND_ENTERPRISE,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }
}

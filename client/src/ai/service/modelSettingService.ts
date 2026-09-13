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
import type {ModelSettingEntity, ModelSettingSavePayload} from '../domain/modelSetting.ts'

export class ModelSettingService extends FindRestfulCrudService<
  ModelSettingSavePayload,
  ModelSettingEntity
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get SERVICE_URL(): string {
    return ModelSettingService.BASE_URL + '/model/setting'
  }

  static get FIND_ENABLED(): string {
    return ModelSettingService.SERVICE_URL + '/enabled'
  }

  static get SORT_URL(): string {
    return ModelSettingService.SERVICE_URL + '/sort'
  }

  constructor() {
    super(ModelSettingService.SERVICE_URL)
  }

  find(request: FilterRequest = {}): Promise<RestResult<ModelSettingEntity[]>> {
    return http().request({
      url: ModelSettingService.SERVICE_URL,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  findEnabled(filter: FilterRequest = {}): Promise<RestResult<ModelSettingEntity[]>> {
    return http().request({
      url: ModelSettingService.FIND_ENABLED,
      method: 'POST',
      data: formUrlEncoded(filter as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  sort(
    sorts: TreeSortMetadata<ModelSettingEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
  ): Promise<RestResult<void>> {
    return http().request({
      url: ModelSettingService.SORT_URL,
      method: 'PUT',
      data: sorts,
      bodyType: 'json',
    })
  }
}

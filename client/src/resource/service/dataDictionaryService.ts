import {
  PageRestfulCrudService,
  type RestResult,
  SYSTEM_CONSTANT,
  SYSTEM_MODULE_NAME,
  type TotalPage,
  type TreeSortMetadata,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {DataDictionaryEntity, DataDictionarySavePayload} from '../domain/dictionary.ts'

export class DataDictionaryService extends PageRestfulCrudService<
  DataDictionarySavePayload,
  DataDictionaryEntity,
  TotalPage<DataDictionaryEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER)
  }

  static get SERVICE_URL(): string {
    return DataDictionaryService.BASE_URL + '/data/dictionary'
  }

  static get SERVICE_SORT(): string {
    return DataDictionaryService.SERVICE_URL + '/sort'
  }

  constructor() {
    super(DataDictionaryService.SERVICE_URL)
  }

  sort(
    sorts: TreeSortMetadata<DataDictionaryEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
  ): Promise<RestResult<void>> {
    return http().request({
      url: DataDictionaryService.SERVICE_SORT,
      method: 'PUT',
      data: sorts,
      bodyType: 'json',
    })
  }
}

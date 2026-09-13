import {FindRestfulCrudService, SYSTEM_MODULE_NAME} from '../../commons'
import {modulePrefix} from '../../http'
import type {DictionaryTypeEntity, DictionaryTypeSavePayload} from '../domain/dictionary.ts'

export class DictionaryTypeService extends FindRestfulCrudService<
  DictionaryTypeSavePayload,
  DictionaryTypeEntity
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.RESOURCE_SERVER)
  }

  static get SERVICE_URL(): string {
    return DictionaryTypeService.BASE_URL + '/dictionary/type'
  }

  constructor() {
    super(DictionaryTypeService.SERVICE_URL)
  }
}

import {PageRestfulCrudService, SYSTEM_MODULE_NAME, type TotalPage} from '../../commons'
import {modulePrefix} from '../../http'
import type {ConsoleUserEntity, ConsoleUserSavePayload} from '../domain/consoleUser.ts'

export class ConsoleUserService extends PageRestfulCrudService<
  ConsoleUserSavePayload,
  ConsoleUserEntity,
  TotalPage<ConsoleUserEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return ConsoleUserService.BASE_URL + '/console/user'
  }

  constructor() {
    super(ConsoleUserService.SERVICE_URL)
  }
}

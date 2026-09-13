import {FindRestfulCrudService, SYSTEM_MODULE_NAME} from '../../commons'
import {modulePrefix} from '../../http'
import type {RoleEntity, RoleSavePayload} from '../domain/role.ts'

export class RoleService extends FindRestfulCrudService<RoleSavePayload, RoleEntity> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return RoleService.BASE_URL + '/role'
  }

  constructor() {
    super(RoleService.SERVICE_URL)
  }
}

import {FindRestfulCrudService, SYSTEM_MODULE_NAME} from '../../commons'
import {modulePrefix} from '../../http'
import type {EnterpriseRoleEntity, EnterpriseRoleSavePayload} from '../domain/enterpriseRole.ts'

export class EnterpriseRoleService extends FindRestfulCrudService<
  EnterpriseRoleSavePayload,
  EnterpriseRoleEntity
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return EnterpriseRoleService.BASE_URL + '/enterprise/role'
  }

  constructor() {
    super(EnterpriseRoleService.SERVICE_URL)
  }
}

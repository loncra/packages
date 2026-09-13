import {PageRestfulCrudService, SYSTEM_MODULE_NAME, type TotalPage} from '../../commons'
import {modulePrefix} from '../../http'
import type {EnterpriseInvitationEntity, EnterpriseInvitationSavePayload} from '../domain/enterpriseInvitation.ts'

export class EnterpriseInvitationService extends PageRestfulCrudService<
  EnterpriseInvitationSavePayload,
  EnterpriseInvitationEntity,
  TotalPage<EnterpriseInvitationEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return EnterpriseInvitationService.BASE_URL + '/enterprise/invitation'
  }

  static get DETAIL_URL(): string {
    return EnterpriseInvitationService.SERVICE_URL + '/detail'
  }

  constructor() {
    super(EnterpriseInvitationService.SERVICE_URL)
  }
}

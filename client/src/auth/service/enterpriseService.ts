import {
    formUrlEncoded,
    PageRestfulCrudService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {EnterpriseEntity, EnterprisePayload, PersonalEnterprise} from '../domain/enterprise.ts'
import type {EnterpriseInvitationDetail} from '../domain/enterpriseInvitation.ts'

export class EnterpriseService extends PageRestfulCrudService<
  EnterprisePayload,
  EnterpriseEntity,
  TotalPage<EnterpriseEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return EnterpriseService.BASE_URL + '/enterprise'
  }

  static get MY_URL(): string {
    return EnterpriseService.SERVICE_URL + '/my'
  }

  static get SWITCH_URL(): string {
    return EnterpriseService.SERVICE_URL + '/switch'
  }

  static get MEMBERS_LEAVE_URL(): string {
    return EnterpriseService.SERVICE_URL + '/member/leave'
  }

  static get INVITATION_DETAIL_URL(): string {
    return EnterpriseService.SERVICE_URL + '/invitation/detail'
  }

  static get INVITATION_CONFIRM_URL(): string {
    return EnterpriseService.SERVICE_URL + '/invitation/confirm'
  }

  constructor() {
    super(EnterpriseService.SERVICE_URL)
  }

  my(): Promise<RestResult<PersonalEnterprise[]>> {
    return http().request({
      url: EnterpriseService.MY_URL,
      method: 'GET',
    })
  }

  switch(enterpriseId?: number): Promise<RestResult<string | undefined>> {
    if (enterpriseId) {
      return http().request({
        url: EnterpriseService.SWITCH_URL,
        method: 'PUT',
        data: formUrlEncoded({enterpriseId}),
        bodyType: 'form',
      })
    }
    return http().request({
      url: EnterpriseService.SWITCH_URL,
      method: 'PUT',
    })
  }

  leave(enterpriseId: number): Promise<RestResult<void>> {
    return http().request({
      url: EnterpriseService.MEMBERS_LEAVE_URL + '/' + enterpriseId,
      method: 'DELETE',
    })
  }

  invitationDetail(id: number): Promise<RestResult<EnterpriseInvitationDetail>> {
    return http().request({
      url: EnterpriseService.INVITATION_DETAIL_URL + '/' + id,
      method: 'GET',
    })
  }

  invitationConfirm(id: number, confirm: boolean): Promise<RestResult<EnterpriseInvitationDetail>> {
    return http().request({
      url: EnterpriseService.INVITATION_CONFIRM_URL + '/' + id,
      method: 'POST',
      data: formUrlEncoded({confirm}),
      bodyType: 'form',
    })
  }
}

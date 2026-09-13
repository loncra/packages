import {
    type AuditMetadata,
    formUrlEncoded,
    PageRestfulCrudService,
    type RestResult,
    SYSTEM_MODULE_NAME,
    type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {EnterpriseMemberEntity, EnterpriseMemberSavePayload} from '../domain/enterpriseMember.ts'

export class EnterpriseMemberService extends PageRestfulCrudService<
  EnterpriseMemberSavePayload,
  EnterpriseMemberEntity,
  TotalPage<EnterpriseMemberEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return EnterpriseMemberService.BASE_URL + '/enterprise/member'
  }

  static get AUDIT_URL(): string {
    return EnterpriseMemberService.SERVICE_URL + '/audit'
  }

  constructor() {
    super(EnterpriseMemberService.SERVICE_URL)
  }

  audit(ids: number[], auditMetadata: AuditMetadata): Promise<RestResult<void>> {
    return http().request({
      url: EnterpriseMemberService.AUDIT_URL,
      method: 'PUT',
      data: auditMetadata,
      bodyType: 'json',
      params: formUrlEncoded({ids}),
    })
  }
}

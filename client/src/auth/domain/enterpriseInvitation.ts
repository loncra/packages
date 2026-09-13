import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {RoleAuthority} from './auth.ts'
import type {EnterpriseEntity} from './enterprise.ts'
import type {EnterpriseMemberEntity} from './enterpriseMember.ts'

export interface EnterpriseInvitationSavePayload extends VersionEntityMetadata {
  expirationTime?: number
  roleIds: number[]
  auditType: NameValueEnumMetadata<number> | number
  remark?: string
  subTitle?: string
}

export interface EnterpriseInvitationEntity extends EnterpriseInvitationSavePayload {
  enterpriseId: number
  principal: string
  status: NameValueEnumMetadata<number> | number
  auditType: NameValueEnumMetadata<number> | number
  tenantId?: string
  member: EnterpriseMemberEntity
  roles?: RoleAuthority[]
}

export interface EnterpriseInvitationDetail extends EnterpriseInvitationEntity {
  enterprise: EnterpriseEntity
  invitee?: EnterpriseMemberEntity
}

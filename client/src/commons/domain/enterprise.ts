import type {NameValueEnumMetadata, VersionEntityMetadata} from './common.ts'

export interface EnterprisePayload extends VersionEntityMetadata {
  name: string
  icon?: string
  remark?: string
}

export interface EnterpriseEntity extends EnterprisePayload {
  ownerPrincipal: string
  enabled: NameValueEnumMetadata<number> | number
  tenantId?: string
  disbandTime?: number
}

export interface PersonalEnterprise extends EnterpriseEntity {
  role?: NameValueEnumMetadata<number> | number
  auditStatus?: NameValueEnumMetadata<number> | number
  userStatus?: NameValueEnumMetadata<number> | number
}

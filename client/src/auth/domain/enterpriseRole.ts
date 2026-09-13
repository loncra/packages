import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {RoleAuthority} from './auth.ts'

export interface EnterpriseRoleSavePayload extends VersionEntityMetadata, RoleAuthority {
  enabled: NameValueEnumMetadata<number> | number
  resourceIds: number[]
  parentId?: number
  removable: NameValueEnumMetadata<number> | number
  modifiable: NameValueEnumMetadata<number> | number
  remark?: string
}

export interface EnterpriseRoleEntity extends EnterpriseRoleSavePayload {
  children: EnterpriseRoleSavePayload[]
}

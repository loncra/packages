import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {PlatformUser, RoleAuthority, UserInitializationMetadata} from './auth.ts'

export interface EnterpriseMemberSavePayload extends PlatformUser, VersionEntityMetadata {
  enterpriseId: number
  principal: string
  roleIds?: number[]
  role: NameValueEnumMetadata<number> | number
}

export interface EnterpriseMemberEntity extends EnterpriseMemberSavePayload {
  auditStatus: NameValueEnumMetadata<number> | number
  lastAuthenticationTime?: number
  gender: NameValueEnumMetadata<number> | number
  initialization: UserInitializationMetadata
  roles?: RoleAuthority[]
  remark?: string
}

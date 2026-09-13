import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {RoleAuthority} from './auth.ts'

export interface RoleSavePayload extends VersionEntityMetadata, RoleAuthority {
  enabled: NameValueEnumMetadata<number> | number
  sources: NameValueEnumMetadata<string>[] | string[]
  resourceIds: number[]
  parentId?: number
  removable: NameValueEnumMetadata<number> | number
  modifiable: NameValueEnumMetadata<number> | number
  remark?: string
}

export interface RoleEntity extends RoleSavePayload {
  children: RoleEntity[]
}

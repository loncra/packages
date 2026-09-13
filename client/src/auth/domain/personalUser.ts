import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {PlatformUser, UserInitializationMetadata} from './auth.ts'

export interface PersonalUserSavePayload extends PlatformUser, VersionEntityMetadata {
  nickname: string
  gender: NameValueEnumMetadata<number> | number
}

export interface PersonalUserEntity extends PersonalUserSavePayload {
  lastAuthenticationTime: number
  initialization: UserInitializationMetadata
  type: NameValueEnumMetadata<string>
  tenantId?: string
  lastActiveEnterpriseId?: number
  promoCode?: string
}

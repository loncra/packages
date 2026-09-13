import type {NameValueEnumMetadata, VersionEntityMetadata} from '../../commons'
import type {PlatformUser, UserInitializationMetadata} from './auth.ts'

export interface ConsoleUserSavePayload extends PlatformUser, VersionEntityMetadata {
  realName: string
  gender: NameValueEnumMetadata<number> | number
  remark?: string
}

export interface ConsoleUserEntity extends ConsoleUserSavePayload {
  lastAuthenticationTime: number
  initialization: UserInitializationMetadata
  type: NameValueEnumMetadata<string>
}

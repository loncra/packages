import type {BasicIdMetadata, NameValueEnumMetadata, TimeProperties, VersionEntityMetadata,} from './common.ts'
import type {ObjectWriteResult} from './attachment.ts'
import type {PersonalEnterprise} from './enterprise.ts'
import type {AUTHENTICATION_TYPE, LOGIN_TYPE} from '../enumerate.ts'

export type AuthenticationType = (typeof AUTHENTICATION_TYPE)[keyof typeof AUTHENTICATION_TYPE]

export type LoginType = (typeof LOGIN_TYPE)[keyof typeof LOGIN_TYPE]

export interface AuthCredentials {
  username: string
  password: string
  confirmPassword?: string
  loginType: LoginType
  captchaType?: string
  [key: string]: unknown
}

export interface Role {
  name: string
  authority: string
}

export interface UserMetadata {
  role?: Role[]
  avatar?: ObjectWriteResult
  creationTime?: number
  email?: string
  emailVerified?: NameValueEnumMetadata<number>
  phoneNumber?: string
  phoneNumberVerified?: NameValueEnumMetadata<number>
  gender?: NameValueEnumMetadata<number>
  realName?: string
  nickname?: string
  tenantId: string
  enterpriseId?: number
  [key: string]: unknown
}

export interface AccessToken {
  creationTime: number
  value: string
  expiresTime: TimeProperties
}

export interface AuthenticationRequestDetails {
  requestHeaders?: Record<string, string | string[]>
  remoteAddress?: string
  type?: string
}

export interface Details {
  metadata: UserMetadata
  token?: AccessToken
  requestDetails?: AuthenticationRequestDetails
  [key: string]: unknown
}

export interface Principal extends BasicIdMetadata<string> {
  username: string
}

export interface AuthenticationInfo {
  details: Details
  authenticated: boolean
  principal: Principal
  lastAuthenticationTime?: number
  type: AuthenticationType
  name: string
  shortName: string
  grantedAuthorities: string[]
  rememberMe: boolean
  enterpriseDataSource: PersonalEnterprise[]
  switchingWorkspace?: boolean
}

export interface PrepareData extends AuthenticationInfo {
  pluginServices: string[]
  deviceIdentified: string
  runtimeMode: string
}

export interface BasicSystemUser extends BasicIdMetadata<number> {
  username: string
  status: NameValueEnumMetadata<number> | number
}

export interface RoleAuthority extends BasicIdMetadata<number> {
  name: string
  authority: string
}

export interface PlatformUser extends BasicSystemUser, VersionEntityMetadata {
  email?: string
  phoneNumber?: string
  phoneNumberVerified: NameValueEnumMetadata<number> | number
  emailVerified: NameValueEnumMetadata<number> | number
  roleIds?: number[]
  resourceIds?: number[]
  systemName: string
  realName?: string
  nickname?: string
  avatar?: ObjectWriteResult
}

export interface UserInitializationMetadata {
  randomPassword: NameValueEnumMetadata<number>
  randomUsername: NameValueEnumMetadata<number>
}

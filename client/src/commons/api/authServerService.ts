import {SYSTEM_MODULE_NAME} from '../constants/system.ts'
import type {IdNameValueMetadata, PageRequest, RestResult} from '../domain/common.ts'
import type {
    AuthCredentials,
    AuthenticationInfo,
    AuthenticationType,
    PlatformUser,
    PrepareData,
    UserMetadata,
} from '../domain/auth.ts'
import type {ResourceEntity} from '../domain/resource.ts'
import {formUrlEncoded} from '../utils/formUrlEncoded.ts'
import {getClient, http, modulePrefix} from '../../http'

export class AuthServerService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get LOGIN_URL(): string {
    return AuthServerService.BASE_URL + '/login'
  }

  static get LOGOUT_URL(): string {
    return AuthServerService.BASE_URL + '/logout'
  }

  static get PREPARE_URL(): string {
    return AuthServerService.BASE_URL + '/prepare'
  }

  static get PRINCIPAL_RESOURCES_URL(): string {
    return AuthServerService.BASE_URL + '/principalResources'
  }

  static get UPDATE_PASSWORD_URL(): string {
    return AuthServerService.BASE_URL + '/user/password/update'
  }

  static get REST_PASSWORD_URL(): string {
    return AuthServerService.BASE_URL + '/user/password/reset'
  }

  static get ADMIN_RESET_PASSWORD_URL(): string {
    return AuthServerService.BASE_URL + '/user/password/admin/reset'
  }

  static get SYSTEM_USERS_URL(): string {
    return AuthServerService.BASE_URL + '/system/users'
  }

  static get SYSTEM_USERS_NOT_DESENSITIZE_NAME_URL(): string {
    return AuthServerService.BASE_URL + '/system/users/undesensitize/name'
  }

  static updatePassword(oldPassword: string, newPassword: string): Promise<RestResult<void>> {
    return http().request({
      url: AuthServerService.UPDATE_PASSWORD_URL,
      method: 'PUT',
      data: formUrlEncoded({oldPassword, newPassword}),
      bodyType: 'form',
    })
  }

  static adminResetPassword(type: string, id: string): Promise<RestResult<string>> {
    return http().request({
      url: AuthServerService.ADMIN_RESET_PASSWORD_URL,
      method: 'PUT',
      data: formUrlEncoded({type, id}),
      bodyType: 'form',
    })
  }

  static resetPassword(
    type: string,
    userId: number,
    newPassword: string,
    confirmPassword: string,
    appendParams?: Record<string, unknown>,
  ): Promise<RestResult<void>> {
    return http().request({
      url: AuthServerService.REST_PASSWORD_URL,
      method: 'POST',
      data: {type, userId, newPassword, confirmPassword},
      bodyType: 'json',
      params: formUrlEncoded({...(appendParams || {})}),
    })
  }

  static login(
    credentials: AuthCredentials,
    authenticationType: AuthenticationType,
  ): Promise<RestResult<AuthenticationInfo>> {
    const headerName = getClient().authenticationTypeHeaderName
    if (!headerName) {
      throw new Error('@loncra/client: createClient 需配置 authenticationTypeHeaderName')
    }
    return http().request({
      url: AuthServerService.LOGIN_URL,
      method: 'POST',
      data: formUrlEncoded(credentials),
      bodyType: 'form',
      headers: {[headerName]: authenticationType},
    })
  }

  static logout(): Promise<RestResult<Record<string, unknown>>> {
    return http().request({
      url: AuthServerService.LOGOUT_URL,
      method: 'POST',
    })
  }

  static prepare(): Promise<RestResult<PrepareData>> {
    return http().request({
      url: AuthServerService.PREPARE_URL,
      method: 'GET',
    })
  }

  static systemUsers(
    request: PageRequest,
    idNameValueMetadata = true,
    desensitizeName = true,
  ): Promise<RestResult<IdNameValueMetadata<PlatformUser[]>[]>> {
    const url = desensitizeName
      ? AuthServerService.SYSTEM_USERS_URL
      : AuthServerService.SYSTEM_USERS_NOT_DESENSITIZE_NAME_URL
    return http().request({
      url,
      method: 'POST',
      data: formUrlEncoded({...request, idNameValueMetadata}),
      bodyType: 'form',
    })
  }

  static principalResources(
    resourceTypes?: string[],
    mergeTree = true,
  ): Promise<RestResult<ResourceEntity[]>> {
    return http().request({
      url: AuthServerService.PRINCIPAL_RESOURCES_URL,
      method: 'GET',
      params: formUrlEncoded({types: resourceTypes, mergeTree}),
    })
  }

  static getPrincipalNameByUserDetails(
    details: PlatformUser | UserMetadata | undefined | null,
    defaultValue = '',
  ): string {
    if (!details) {
      return ''
    }
    return String(details.realName || details.nickname || details.username || defaultValue)
  }
}

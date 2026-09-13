import {SYSTEM_MODULE_NAME} from '../constants/system.ts'
import type {RestResult} from '../domain/common.ts'
import type {ObjectWriteResult} from '../domain/attachment.ts'
import type {AuthenticationInfo} from '../domain/auth.ts'
import {http, modulePrefix} from '../../http'

export class AvatarServerService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get PRINCIPAL_AVATAR_UPLOAD_URL(): string {
    return AvatarServerService.BASE_URL + '/user/avatar'
  }

  static update(object: ObjectWriteResult | null): Promise<RestResult<void>> {
    return http().request({
      url: AvatarServerService.PRINCIPAL_AVATAR_UPLOAD_URL,
      method: 'PUT',
      data: object,
      bodyType: 'json',
      headers: {'Content-Type': 'application/json'},
    })
  }

  static getUploadUrl(authInfo: AuthenticationInfo): string {
    return (
      AvatarServerService.PRINCIPAL_AVATAR_UPLOAD_URL +
      '?accessToken=' +
      (authInfo?.details?.token?.value || '')
    )
  }
}

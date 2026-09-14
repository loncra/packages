import {getEnumValue, type RestResult, SYSTEM_MODULE_NAME} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {UserPluginInstallRequestBody, UserPluginInstallResult} from '../domain/userPluginInstall.ts'
import {AI_SERVER_PLUGIN_TARGET_TYPE} from '../enumerate.ts'

export class AiUserPluginInstallService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get SERVICE_URL(): string {
    return AiUserPluginInstallService.BASE_URL + '/ai/user/plugin/install'
  }

  static install(
    body: UserPluginInstallRequestBody,
  ): Promise<RestResult<UserPluginInstallResult>> {
    return http().request({
      url: AiUserPluginInstallService.SERVICE_URL,
      method: 'POST',
      data: body,
      bodyType: 'json',
    })
  }

  static my(): Promise<RestResult<UserPluginInstallResult[]>> {
    return http().request({
      url: AiUserPluginInstallService.SERVICE_URL + '/my',
      method: 'POST',
    })
  }

  static uninstall(id: number): Promise<RestResult<void>> {
    return http().request({
      url: AiUserPluginInstallService.SERVICE_URL + '/' + id,
      method: 'DELETE',
    })
  }

  static mapInstallsByPackageId(
    installs: UserPluginInstallResult[],
    targetType: number,
  ): Map<number, UserPluginInstallResult> {
    const map = new Map<number, UserPluginInstallResult>()
    for (const install of installs) {
      if (install.packageId == null || getEnumValue(install.targetType) !== targetType) {
        continue
      }
      map.set(install.packageId, install)
    }
    return map
  }

  static isSkillOutdated(
    installs: UserPluginInstallResult[],
    record: {id?: number; latestVersion?: string},
  ): boolean {
    if (record.id == null || !record.latestVersion) {
      return false
    }
    const install = installs.find(
      (item) =>
        getEnumValue(item.targetType) === AI_SERVER_PLUGIN_TARGET_TYPE.SKILL && item.packageId === record.id,
    )
    const locked = install?.metadata?.releaseVersion
    return Boolean(locked) && locked !== record.latestVersion
  }
}

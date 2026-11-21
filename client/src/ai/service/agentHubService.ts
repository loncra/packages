import {getEnumValue, type RestResult, SYSTEM_MODULE_NAME} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {
  PluginInstallGroup,
  UserPluginInstallResult,
  UserPluginRequestBody,
  UserPluginSkillMetadata
} from '../domain/userPluginInstall.ts'
import {AI_SERVER_PLUGIN_INSTALL_USER_SCOPE} from '../enumerate.ts'
import type {PluginPackageUpdatePolicyMetadata} from "../domain/plugin.ts";

export class AgentHubService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AI_SERVER)
  }

  static get SERVICE_URL(): string {
    return AgentHubService.BASE_URL + '/agent/hub'
  }

  static install(
    body: UserPluginRequestBody,
  ): Promise<RestResult<UserPluginInstallResult[]>> {
    return http().request({
      url: AgentHubService.SERVICE_URL,
      method: 'POST',
      data: body,
      bodyType: 'json',
    })
  }

  static my(): Promise<RestResult<UserPluginInstallResult[]>> {
    return http().request({
      url: AgentHubService.SERVICE_URL + '/my',
      method: 'POST',
    })
  }

  static uninstall(body: UserPluginRequestBody): Promise<RestResult<void>> {
    return http().request({
      url: AgentHubService.SERVICE_URL,
      method: 'DELETE',
      data: body,
      bodyType: 'json',
    })
  }

  static isPluginOutdated(
    installs: UserPluginInstallResult[],
    record: PluginPackageUpdatePolicyMetadata,
    targetType:string
  ): boolean {
    if (record.id == null || !record.latestVersion) {
      return false
    }
    const install = installs.filter(item => getEnumValue(item.targetType) === targetType)
        .find(item => item.pluginPackage.id === record.id)
    if (!install) {
      return false
    }
    const skillMetadata = install.metadata as UserPluginSkillMetadata;
    const locked = skillMetadata.releaseVersion
    return Boolean(locked) && locked !== record.latestVersion
  }
}

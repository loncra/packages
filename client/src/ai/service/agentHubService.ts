import {type RestResult, SYSTEM_MODULE_NAME} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {UserPluginInstallResult, UserPluginRequestBody,} from '../domain/userPluginInstall.ts'

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

}

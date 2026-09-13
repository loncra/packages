import {DetailSearchRestfulService, type RestResult, SYSTEM_MODULE_NAME} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {AuditEventEntity} from '../domain/audit.ts'

export class AuditEventService extends DetailSearchRestfulService<AuditEventEntity> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return AuditEventService.BASE_URL + '/audit/event/authentication'
  }

  constructor() {
    super(AuditEventService.SERVICE_URL)
  }

  detail(id: string, after: string): Promise<RestResult<AuditEventEntity>> {
    return http().request({
      url: this.baseUrl + '/' + id + '?after=' + after,
      method: 'GET',
    })
  }
}

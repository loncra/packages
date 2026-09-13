import {PageSearchRestfulService, SYSTEM_MODULE_NAME, type TotalPage} from '../../commons'
import {modulePrefix} from '../../http'
import type {AuditEventEntity} from '../domain/audit.ts'

export class AuthenticationAuditEventService extends PageSearchRestfulService<
  AuditEventEntity,
  TotalPage<AuditEventEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return AuthenticationAuditEventService.BASE_URL + '/audit/event/authentication'
  }

  constructor() {
    super(AuthenticationAuditEventService.SERVICE_URL)
  }
}

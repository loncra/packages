import {PageSearchRestfulService, SYSTEM_MODULE_NAME, type TotalPage} from '../../commons'
import {modulePrefix} from '../../http'
import type {AuditEventEntity} from '../domain/audit.ts'

export class OperationDataTraceAuditEventService extends PageSearchRestfulService<
  AuditEventEntity,
  TotalPage<AuditEventEntity>
> {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.AUTH_SERVER)
  }

  static get SERVICE_URL(): string {
    return OperationDataTraceAuditEventService.BASE_URL + '/audit/event/operationDataTrace'
  }

  constructor() {
    super(OperationDataTraceAuditEventService.SERVICE_URL)
  }
}

import type {BasicIdMetadata, IdNameMetadata, NameValueEnumMetadata} from '../../commons'
import type {Details} from './auth.ts'

export interface ControllerAuditEventMetadata extends IdNameMetadata {
  startTime: number
  executeStatus: NameValueEnumMetadata<number>
  exception: string
  endTime: number
  remark: string
  url: string
  httpMethod: string
  headers: Record<string, string[]>
  parameters: Record<string, string[]>
  body: Record<string, object>
}

export interface OperationTrace {
  id?: string
  target: string
  data: Record<string, object>
  type: NameValueEnumMetadata<string>
  remark: string
}

export interface AuditEventData {
  metadata: ControllerAuditEventMetadata
  details?: Details
  operationTrace?: OperationTrace
}

export interface AuditEventEntity extends BasicIdMetadata<string> {
  timestamp: number
  principal: string
  type: string
  data?: AuditEventData
}

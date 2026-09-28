/** 跨模块共用的后端枚举码。领域枚举在各模块 enumerate.ts，带 XXX_SERVER_ 前缀。 */

export const YES_OR_NO_TYPE = {
  YES: 1,
  NO: 0,
} as const

export const DATA_STATUS = {
  NEW: 10,
  RELEASE: 20,
  REVOKE: 30,
} as const

export const EXECUTE_STATUS_TYPE = {
  PENDING: -1,
  PROCESSING: 0,
  SUCCESS: 1,
  RETRYING: 2,
  IGNORE: 3,
  FAILURE: 99,
  UNKNOWN: 404,
} as const

export const VALUE_TYPE = {
  INTEGER: 10,
  DOUBLE: 20,
  STRING: 30,
  DATE: 40,
  DATE_TIME: 50,
  TIME: 60,
} as const

export const TIME_UNIT_TYPE = {
  NANOSECONDS: 'NANOSECONDS',
  MICROSECONDS: 'MICROSECONDS',
  MILLISECONDS: 'MILLISECONDS',
  SECONDS: 'SECONDS',
  MINUTES: 'MINUTES',
  HOURS: 'HOURS',
  DAYS: 'DAYS',
} as const

/** 审核状态（后端 `AuditStatusEnum`，resource-server）：企业成员 / 邀请 / 短信签名与模板共用 */
export const AUDIT_STATUS_VALUE = {
  AUDITABLE: 10,
  AGREED: 20,
  DISAGREE: 30,
  REJECTED: 40,
  UNKNOWN: 99,
} as const

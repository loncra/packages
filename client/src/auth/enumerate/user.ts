/** 对齐后端 GenderEnum */
export const GENDER = {
  MALE: 10,
  FEMALE: 20,
  UNKNOWN: 30,
} as const

export const USER_STATUS_TYPE = {
  ENABLED: 1,
  DISABLED: 0,
  LOCK: 99,
} as const

export const AUDIT_TYPE_VALUE = {
  MANUAL: 10,
  AUTOMATIC: 20,
} as const

export const AUDIT_STATUS_VALUE = {
  AUDITABLE: 10,
  AGREED: 20,
  DISAGREE: 30,
  REJECTED: 40,
  UNKNOWN: 99,
} as const

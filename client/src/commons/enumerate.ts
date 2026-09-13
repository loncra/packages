/** 跨模块共用的后端枚举码。领域枚举留在各模块 enumerate。 */

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

export const MESSAGE_GROUP = {
  DEFAULT: 'default',
  SITE: 'site',
  USER_CHAT: 'userChat',
  USER_CHAT_CALL: 'userChatCall',
} as const

export const CAPTCHA_TOKEN_TYPE = {
  SMS: 'sms',
  EMAIL: 'email',
  TIANAI: 'tianai',
} as const

export const AUTHENTICATION_TYPE = {
  CONSOLE: 'CONSOLE',
  PERSONAL: 'PERSONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const

export const LOGIN_TYPE = {
  USERNAME_PASSWORD: 'USERNAME_PASSWORD',
  USERNAME_PASSWORD_REGISTER: 'USERNAME_PASSWORD_REGISTER',
  PHONE_CAPTCHA: 'PHONE_CAPTCHA',
  QR_CODE: 'QR_CODE',
} as const

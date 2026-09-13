import {AUTHENTICATION_TYPE} from '../enumerate/authentication.ts'

export const AUTH_SERVER_AUTHENTICATION_TYPE_PARAM = 'authenticationType'

export const AUTHENTICATION_MEMBER_TYPE: ReadonlyArray<string> = [
  AUTHENTICATION_TYPE.ENTERPRISE,
  AUTHENTICATION_TYPE.PERSONAL,
]

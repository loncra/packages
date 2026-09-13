export {AUTHENTICATION_TYPE, LOGIN_TYPE} from '../../commons'

export const RESOURCE_TYPE = {
  ROOT: 'root',
  DIRECTORY: 'directory',
  MENU: 'menu',
  SECURITY: 'security',
  TOOL: 'tool',
  PROFILE: 'profile',
  NAVIGATION_DATA: 'navigationData',
} as const

export const RESOURCE_CATEGORY = {
  PLUGIN: 10,
  CUSTOMIZE: 20,
} as const

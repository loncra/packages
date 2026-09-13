export const AUTH_SERVER_ROLE_AUTHORITY = {
  DELETE: 'perms[auth_server_role:delete]',
  GET: 'perms[auth_server_role:get]',
  SAVE: 'perms[auth_server_role:save]',
} as const

export const AUTH_SERVER_RESOURCE_AUTHORITY = {
  DELETE: 'perms[auth_server_authority_resource:delete]',
  GET: 'perms[auth_server_authority_resource:get]',
  SAVE: 'perms[auth_server_authority_resource:save]',
} as const

export const AUTH_SERVER_SYSTEM_USER_AUTHORITY = {
  ADMIN_RESET_PASSWORD: 'perms[auth_server_system_user:admin_reset_password]',
} as const

export const AUTH_SERVER_CONSOLE_USER_AUTHORITY = {
  DELETE: 'perms[auth_server_console_user:delete]',
  GET: 'perms[auth_server_console_user:get]',
  SAVE: 'perms[auth_server_console_user:save]',
  EXPORT: 'perms[auth_server_console_user:export]',
} as const

export const AUTH_SERVER_PERSONAL_USER_AUTHORITY = {
  PAGE: 'perms[auth_server_personal_user:page]',
  GET: 'perms[auth_server_personal_user:get]',
  EXPORT: 'perms[auth_server_personal_user:export]',
} as const

export const AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY = {
  PAGE: 'perms[auth_server_enterprise_member:page]',
  GET: 'perms[auth_server_enterprise_member:get]',
  SAVE: 'perms[auth_server_enterprise_member:save]',
  DELETE: 'perms[auth_server_enterprise_member:delete]',
  AUDIT: 'perms[auth_server_enterprise_member:audit]',
} as const

export const AUTH_SERVER_ENTERPRISE_AUTHORITY = {
  PAGE: 'perms[auth_server_enterprise:page]',
} as const

export const AUTH_SERVER_ENTERPRISE_ROLE_AUTHORITY = {
  DELETE: 'perms[auth_server_enterprise_role:delete]',
  GET: 'perms[auth_server_enterprise_role:get]',
  SAVE: 'perms[auth_server_enterprise_role:save]',
} as const

export const AUTH_SERVER_ENTERPRISE_INVITATION_AUTHORITY = {
  PAGE: 'perms[auth_server_enterprise_invitation:page]',
  GET: 'perms[auth_server_enterprise_invitation:get]',
  SAVE: 'perms[auth_server_enterprise_invitation:save]',
  DELETE: 'perms[auth_server_enterprise_invitation:delete]',
} as const

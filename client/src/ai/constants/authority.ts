export const AI_SERVER_MODEL_SETTING_AUTHORITY = {
  FIND: 'perms[ai_server_mode_setting:find]',
  GET: 'perms[ai_server_mode_setting:get]',
  SAVE: 'perms[ai_server_mode_setting:save]',
  DELETE: 'perms[ai_server_mode_setting:delete]',
  SORT: 'perms[ai_server_mode_setting:sort]',
} as const

export const MCP_PACKAGE_AUTHORITY = {
  PAGE: 'perms[ai_mcp_package:page]',
  GET: 'perms[ai_mcp_package:get]',
  SAVE: 'perms[ai_mcp_package:save]',
  DELETE: 'perms[ai_mcp_package:delete]',
  RELEASE: 'perms[ai_mcp_package:release]',
  REVOKE: 'perms[ai_mcp_package:revoke]',
} as const

export const SKILL_PACKAGE_AUTHORITY = {
  PAGE: 'perms[ai_skill_package:page]',
  GET: 'perms[ai_skill_package:get]',
  SAVE: 'perms[ai_skill_package:save]',
  DELETE: 'perms[ai_skill_package:delete]',
  RELEASE: 'perms[ai_skill_package:release]',
  REVOKE: 'perms[ai_skill_package:revoke]',
  SNAPSHOT: 'perms[ai_skill_package:snapshot]',
} as const

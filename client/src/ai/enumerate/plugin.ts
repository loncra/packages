export const PACKAGE_TYPE = {
  SYSTEM: 10,
  HUB: 20,
} as const

export const PLUGIN_TARGET_TYPE = {
  SKILL: 10,
  MCP: 20,
} as const

export const PLUGIN_INSTALL_WORKSPACE_SCOPE = {
  USER: 10,
  ORG: 20,
} as const

export const PLUGIN_INSTALL_STATUS = {
  PENDING: 10,
  ACTIVATED: 20,
  DISABLED: 30,
} as const

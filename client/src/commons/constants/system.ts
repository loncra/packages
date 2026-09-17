import {DATA_STATUS, EXECUTE_STATUS_TYPE} from "../enumerate.ts";

export const SYSTEM_CONSTANT = {
  ID_NAME: 'id',
} as const

export const SYSTEM_MODULE_NAME = {
  RESOURCE_SERVER: 'resource-server',
  AI_SERVER: 'ai-server',
  AUTH_SERVER: 'auth-server',
  MESSAGE_SERVER: 'message-server',
} as const

/**
 * {@link ResourceServerService.getServiceEnumerates} 的枚举类名（id）。
 */
export const SYSTEM_ENUM_TYPE = {
  BATCH_MESSAGE_TYPE_ENUM: 'BatchMessageTypeEnum',
  CLOUD_CHANNEL_ENUM: 'CloudChannelEnum',
  CAROUSEL_TYPE_ENUM: 'CarouselTypeEnum',
  DATA_STATUS_ENUM: 'DataStatusEnum',
  EXECUTE_STATUS_ENUM: 'ExecuteStatus',
  GENDER_ENUM: 'GenderEnum',
  MCP_PACKAGE_AUTH_MODE_ENUM: 'McpPackageAuthModeEnum',
  MCP_PACKAGE_TYPE_ENUM: 'PackageTypeEnum',
  MCP_CLIENT_TYPE_ENUM: 'McpClientTypeEnum',
  MESSAGE_TYPE_ENUM: 'MessageTypeEnum',
  PACKAGE_ORIGIN_ENUM: 'PackageOriginEnum',
  PLUGIN_TARGET_TYPE_ENUM: 'PluginTargetTypeEnum',
  SKILL_SOURCE_TYPE_ENUM: 'SkillSourceTypeEnum',
  UPDATE_POLICY_ENUM: 'UpdatePolicyEnum',
  MODEL_TYPE_ENUM: 'ModelTypeEnum',
  OPERATION_DATA_TYPE_ENUM: 'OperationDataType',
  RESOURCE_CATEGORY_ENUM: 'ResourceCategoryEnum',
  RESOURCE_SOURCE_ENUM: 'ResourceSourceEnum',
  RESOURCE_TYPE_ENUM: 'ResourceTypeEnum',
  SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM: 'SiteMessagePushableChannelEnum',
  TIME_UNIT_ENUM: 'TimeUnitEnum',
  USER_STATUS_ENUM: 'UserStatus',
  ENTERPRISE_MEMBER_ROLE_ENUM: 'EnterpriseMemberRoleEnum',
  ENTERPRISE_INVITATION_STATUS_ENUM: 'EnterpriseInvitationStatusEnum',
  AUDIT_TYPE_ENUM: 'AuditTypeEnum',
  AUDIT_STATUS_ENUM: 'AuditStatusEnum',
  VALUE_TYPE_ENUM: 'ValueTypeEnum',
  YES_OR_NO: 'YesOrNo',
} as const

export const OPERATION_DATA_TRACE_TABLE = {
  DICTIONARY_TYPE: 'tb_dictionary_type',
  DATA_DICTIONARY: 'tb_data_dictionary',
  CAROUSEL: 'tb_carousel',
  SMS_MESSAGE: 'tb_sms_message',
  SITE_MESSAGE: 'tb_site_message',
  EMAIL_MESSAGE: 'tb_email_message',
  ROLE: 'tb_role',
  ENTERPRISE_ROLE: 'tb_enterprise_role',
  RESOURCE: 'tb_resource',
  CONSOLE_USER: 'tb_console_user',
  ENTERPRISE_MEMBER: 'tb_enterprise_member',
  AI_MODEL_SETTING: 'tb_ai_model_setting',
  AI_MCP_PACKAGE: 'tb_ai_mcp_package',
  AI_SKILL_PACKAGE: 'tb_ai_skill_package',
  ENTERPRISE: 'tb_enterprise',
  PERSONAL_USER: 'tb_personal_user',
  ENTERPRISE_INVITATION: 'tb_enterprise_invitation',
} as const

export const EXECUTE_TYPE_RETRY_STATUS: ReadonlyArray<number> = [
  EXECUTE_STATUS_TYPE.PENDING,
  EXECUTE_STATUS_TYPE.FAILURE,
  EXECUTE_STATUS_TYPE.UNKNOWN,
]

export const DATA_RELEASE_STATUS: ReadonlyArray<number> = [DATA_STATUS.NEW, DATA_STATUS.REVOKE]

export const HTTP_SUCCESS_EXECUTE_CODES = ['200'] as const

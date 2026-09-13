export const MESSAGE_SERVER_BATCH_AUTHORITY = {
  DELETE: 'perms[message_server_batch:delete]',
  GET: 'perms[message_server_batch:get]',
  EXPORT: 'perms[message_server_batch:export]',
} as const

export const MESSAGE_SERVER_EMAIL_AUTHORITY = {
  DELETE: 'perms[message_server_email:delete]',
  GET: 'perms[message_server_email:get]',
  EXPORT: 'perms[message_server_email:export]',
  SEND: 'perms[message_server_email:send]',
} as const

export const MESSAGE_SERVER_SITE_AUTHORITY = {
  DELETE: 'perms[message_server_site:delete]',
  GET: 'perms[message_server_site:get]',
  EXPORT: 'perms[message_server_site:export]',
  SEND: 'perms[message_server_site:send]',
} as const

export const MESSAGE_SERVER_SMS_AUTHORITY = {
  DELETE: 'perms[message_server_sms:delete]',
  GET: 'perms[message_server_sms:get]',
  EXPORT: 'perms[message_server_sms:export]',
  SEND: 'perms[message_server_sms:send]',
} as const

export const MESSAGE_SERVER_SMS_TEMPLATE_AUTHORITY = {
  FIND: 'perms[message_server_sms_template:find]',
  GET: 'perms[message_server_sms_template:get]',
} as const

export const MESSAGE_SERVER_SMS_SIGN_AUTHORITY = {
  FIND: 'perms[message_server_sms_sign:find]',
  GET: 'perms[message_server_sms_sign:get]',
} as const

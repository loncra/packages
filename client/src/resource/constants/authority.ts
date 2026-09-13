export const RESOURCE_SERVER_DATA_DICTIONARY_AUTHORITY = {
  FIND: 'perms[resource_server_data_dictionary:find]',
  GET: 'perms[resource_server_data_dictionary:get]',
  SAVE: 'perms[resource_server_data_dictionary:save]',
  DELETE: 'perms[resource_server_data_dictionary:delete]',
  SORT: 'perms[resource_server_data_dictionary:sort]',
} as const

export const RESOURCE_SERVER_DICTIONARY_TYPE_AUTHORITY = {
  FIND: 'perms[resource_server_dictionary_type:find]',
  GET: 'perms[resource_server_dictionary_type:get]',
  SAVE: 'perms[resource_server_dictionary_type:save]',
  DELETE: 'perms[resource_server_dictionary_type:delete]',
} as const

export const RESOURCE_SERVER_CAROUSEL_AUTHORITY = {
  SAVE: 'perms[resource_server_carousel:save]',
  GET: 'perms[resource_server_carousel:get]',
  EXPORT: 'perms[resource_server_carousel:export]',
  DELETE: 'perms[resource_server_carousel:delete]',
  RELEASE: 'perms[resource_server_carousel:release]',
  REVOKE: 'perms[resource_server_carousel:revoke]',
} as const

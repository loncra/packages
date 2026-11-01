/** im 域的 socket 业务事件名（与后端协议一致） */
export const IM_SOCKET_EVENT = {
  CHAT_MESSAGE: 'chat_message',
  CHAT_MESSAGE_MENTION: 'chat_message_mention',
  CHAT_MESSAGE_READ: 'chat_message_read',
  CHAT_MESSAGE_UNDO: 'chat_message_undo',
  CHAT_MESSAGE_UPDATE: 'chat_message_update',
  CHAT_MESSAGE_READ_UPDATE: 'chat_message_read_update',
  CHAT_CONVERSATION_CREATE: 'chat_conversation_create',
  CHAT_CONVERSATION_REFRESH: 'chat_conversation_refresh',
  CHAT_CONVERSATION_REFRESH_BY_ROOM_ID: 'chat_conversation_refresh_by_room_id',
  CHAT_PARTICIPANT_REFRESH_BY_ROOM_ID: 'chat_participant_refresh_by_room_id',
  CHAT_CALL: 'chat_call',
  CHAT_CALL_UPDATE: 'chat_call_update',
  CHAT_CALL_COMPLETED: 'chat_call_completed',
  CHAT_CALL_CONFIRM: 'chat_call_confirm',
  CHAT_CALL_PARTICIPANT_UPDATE: 'chat_call_participant_update',
} as const

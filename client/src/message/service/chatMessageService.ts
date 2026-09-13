import {
  formUrlEncoded,
  type PageRequest,
  type PageResult,
  type RestResult,
  SYSTEM_MODULE_NAME,
  type TotalPage,
} from '../../commons'
import {http, modulePrefix} from '../../http'
import type {
  BasicUserChatConversation,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageReadResponseBody,
  UserChatMessageResponseBody,
  UserChatParticipantEntity,
  UserChatRoomEntity,
} from '../domain/userChat.ts'

export class ChatMessageService {
  static get BASE_URL(): string {
    return modulePrefix(SYSTEM_MODULE_NAME.MESSAGE_SERVER)
  }

  static get SERVICE_URL(): string {
    return ChatMessageService.BASE_URL + '/user/chat'
  }

  static get CREATE_CONVERSATION_URL(): string {
    return ChatMessageService.SERVICE_URL + '/conversation/create'
  }

  static get CREATE_SEND_URL(): string {
    return ChatMessageService.SERVICE_URL + '/send'
  }

  static get CREATE_HISTORIES_URL(): string {
    return ChatMessageService.SERVICE_URL + '/message/histories'
  }

  static get MESSAGE_READ_URL(): string {
    return ChatMessageService.SERVICE_URL + '/message/read'
  }

  static get MESSAGE_UNDO_URL(): string {
    return ChatMessageService.SERVICE_URL + '/message/undo'
  }

  static get MESSAGE_POSITIONING_PAGE_NUMBER_URL(): string {
    return ChatMessageService.SERVICE_URL + '/message/positioning/page/number'
  }

  static get CREATE_PINNED_CONVERSATION_URL(): string {
    return ChatMessageService.SERVICE_URL + '/conversation/pinned'
  }

  static get CREATE_MUTED_CONVERSATION_URL(): string {
    return ChatMessageService.SERVICE_URL + '/conversation/muted'
  }

  static get CREATE_DELETE_CONVERSATION_URL(): string {
    return ChatMessageService.SERVICE_URL + '/conversation'
  }

  static get ADD_ROOM_PARTICIPANT_URL(): string {
    return ChatMessageService.SERVICE_URL + '/participant/add'
  }

  static get REMOVE_ROOM_PARTICIPANT_URL(): string {
    return ChatMessageService.SERVICE_URL + '/participant/remove'
  }

  static get FIND_PARTICIPANT_URL(): string {
    return ChatMessageService.SERVICE_URL + '/participant/find'
  }

  static get UPDATE_PARTICIPANT_TYPE_URL(): string {
    return ChatMessageService.SERVICE_URL + '/participant/update/type'
  }

  static get PARTICIPANT_EXIST_ROOM_URL(): string {
    return ChatMessageService.SERVICE_URL + '/participant/exist/room'
  }

  static get DISBAND_ROOM_RUL(): string {
    return ChatMessageService.SERVICE_URL + '/room/disband'
  }

  static get ROOM_RENAME_URL(): string {
    return ChatMessageService.SERVICE_URL + '/room/rename'
  }

  static get FIND_MESSAGE_READ_URL(): string {
    return ChatMessageService.SERVICE_URL + '/message/read/find'
  }

  static get GET_CONVERSATION_URL(): string {
    return ChatMessageService.SERVICE_URL + '/conversation'
  }

  static my(): Promise<RestResult<UserChatConversationResponseBody[]>> {
    return http().request({
      url: ChatMessageService.SERVICE_URL,
      method: 'POST',
    })
  }

  static createConversation(
    body: UserChatRoomEntity,
    principals: string[],
  ): Promise<RestResult<UserChatConversationResponseBody>> {
    return http().request({
      url: ChatMessageService.CREATE_CONVERSATION_URL,
      method: 'PUT',
      data: body,
      bodyType: 'json',
      params: formUrlEncoded({principals}),
    })
  }

  static send(body: unknown[], roomId: string): Promise<RestResult<UserChatMessageResponseBody>> {
    return http().request({
      url: ChatMessageService.CREATE_SEND_URL + '/' + roomId,
      method: 'PUT',
      data: body,
      bodyType: 'json',
    })
  }

  static histories(
    request: PageRequest,
    roomId: number,
  ): Promise<RestResult<PageResult<UserChatMessageResponseBody> | TotalPage<UserChatMessageResponseBody>>> {
    return http().request({
      url: ChatMessageService.CREATE_HISTORIES_URL + '/' + roomId,
      method: 'POST',
      data: formUrlEncoded(request as Record<string, unknown>),
      bodyType: 'form',
    })
  }

  static readMessage(messageIds: number[]): Promise<RestResult<PageResult<UserChatMessageResponseBody>>> {
    return http().request({
      url: ChatMessageService.MESSAGE_READ_URL,
      method: 'POST',
      data: formUrlEncoded({messageIds}),
      bodyType: 'form',
    })
  }

  static undoMessage(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.MESSAGE_UNDO_URL,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  static positioningMessagePageNumber(
    chatRoomId: number,
    messageId: number,
    size: number,
  ): Promise<RestResult<number>> {
    return http().request({
      url:
        ChatMessageService.MESSAGE_POSITIONING_PAGE_NUMBER_URL +
        '/' +
        chatRoomId +
        '/' +
        messageId +
        '/' +
        size,
      method: 'GET',
    })
  }

  static pinnedConversation(ids: number[]): Promise<RestResult<BasicUserChatConversation[]>> {
    return http().request({
      url: ChatMessageService.CREATE_PINNED_CONVERSATION_URL,
      method: 'PUT',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  static mutedConversation(ids: number[]): Promise<RestResult<BasicUserChatConversation[]>> {
    return http().request({
      url: ChatMessageService.CREATE_MUTED_CONVERSATION_URL,
      method: 'PUT',
      data: formUrlEncoded({ids}),
      bodyType: 'form',
    })
  }

  static deleteConversation(ids: number[]): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.CREATE_DELETE_CONVERSATION_URL,
      method: 'DELETE',
      params: formUrlEncoded({ids}),
    })
  }

  static addRoomParticipant(
    roomId: number,
    principals: string[],
  ): Promise<RestResult<UserChatConversationResponseBody>> {
    return http().request({
      url: ChatMessageService.ADD_ROOM_PARTICIPANT_URL + '/' + roomId,
      method: 'PUT',
      data: formUrlEncoded({principals}),
      bodyType: 'form',
    })
  }

  static findRoomParticipant(roomId: number): Promise<RestResult<UserChatParticipantEntity[]>> {
    return http().request({
      url: ChatMessageService.FIND_PARTICIPANT_URL + '/' + roomId,
      method: 'POST',
    })
  }

  static removeRoomParticipant(roomId: number, principals: string[]): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.REMOVE_ROOM_PARTICIPANT_URL + '/' + roomId,
      method: 'PUT',
      data: formUrlEncoded({principals}),
      bodyType: 'form',
    })
  }

  static updateParticipantType(
    roomId: number,
    type: number,
    principals: string[],
  ): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.UPDATE_PARTICIPANT_TYPE_URL + '/' + roomId,
      method: 'PUT',
      data: formUrlEncoded({type, principals}),
      bodyType: 'form',
    })
  }

  static existRoom(roomId: number): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.PARTICIPANT_EXIST_ROOM_URL,
      method: 'DELETE',
      params: formUrlEncoded({roomId}),
    })
  }

  static disbandRoom(roomId: number): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.DISBAND_ROOM_RUL,
      method: 'DELETE',
      params: formUrlEncoded({roomId}),
    })
  }

  static roomRename(roomId: number, newName: string): Promise<RestResult<void>> {
    return http().request({
      url: ChatMessageService.ROOM_RENAME_URL + '/' + roomId,
      method: 'PUT',
      data: formUrlEncoded({newName}),
      bodyType: 'form',
    })
  }

  static findMessageRead(messageId: number): Promise<RestResult<UserChatMessageReadResponseBody[]>> {
    return http().request({
      url: ChatMessageService.FIND_MESSAGE_READ_URL + '/' + messageId,
      method: 'POST',
    })
  }

  static getConversation(
    roomId: number,
    convertBody = false,
  ): Promise<RestResult<UserChatConversationEntity | UserChatConversationResponseBody>> {
    return http().request({
      url: ChatMessageService.GET_CONVERSATION_URL + '/' + roomId,
      method: 'GET',
      params: formUrlEncoded({convertBody}),
    })
  }
}
